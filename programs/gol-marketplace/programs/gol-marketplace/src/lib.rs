use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("CEjEmwBAGJxmxA8T3W17yjZDVzXX5xrcW9LwpL3Y3Ba9");

#[program]
pub mod gold_marketplace {
    use super::*;

    // Initialize a new listing for gold tokens
    pub fn create_listing(
        ctx: Context<CreateListing>,
        amount: u64,
        price: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.mint = ctx.accounts.mint.key();
        listing.amount = amount;
        listing.price = price;
        listing.timestamp = Clock::get()?.unix_timestamp;
        listing.active = true;

        // Transfer tokens to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(ListingCreated {
            listing_id: listing.key(),
            seller: listing.seller,
            amount,
            price,
        });

        Ok(())
    }

    // Purchase listed gold tokens
    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.active, ErrorCode::ListingNotActive);

        // Transfer SOL from buyer to seller
        let transfer_sol_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &listing.seller,
            listing.price,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_sol_ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Transfer tokens from escrow to buyer
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.listing.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, listing.amount)?;

        // Mark listing as inactive
        let listing = &mut ctx.accounts.listing;
        listing.active = false;

        emit!(ListingPurchased {
            listing_id: listing.key(),
            buyer: ctx.accounts.buyer.key(),
            seller: listing.seller,
            amount: listing.amount,
            price: listing.price,
        });

        Ok(())
    }

    // Cancel an active listing
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.active, ErrorCode::ListingNotActive);

        // Return tokens to seller
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.listing.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, listing.amount)?;

        // Mark listing as inactive
        let listing = &mut ctx.accounts.listing;
        listing.active = false;

        emit!(ListingCancelled {
            listing_id: listing.key(),
            seller: listing.seller,
            amount: listing.amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        init,
        payer = seller,
        space = Listing::LEN
    )]
    pub listing: Account<'info, Listing>,
    
    pub mint: Account<'info, token::Mint>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = listing,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        constraint = listing.active == true,
    )]
    pub listing: Account<'info, Listing>,
    
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    
    #[account(
        mut,
        associated_token::mint = listing.mint,
        associated_token::authority = listing,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = listing.mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        constraint = listing.seller == seller.key(),
        constraint = listing.active == true,
        close = seller
    )]
    pub listing: Account<'info, Listing>,
    
    #[account(
        mut,
        associated_token::mint = listing.mint,
        associated_token::authority = listing,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = listing.mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub price: u64,
    pub timestamp: i64,
    pub active: bool,
}

impl Listing {
    pub const LEN: usize = 8 + // discriminator
        32 + // seller
        32 + // mint
        8 + // amount
        8 + // price
        8 + // timestamp
        1; // active
}

#[error_code]
pub enum ErrorCode {
    #[msg("The listing is not active")]
    ListingNotActive,
    #[msg("Insufficient funds for purchase")]
    InsufficientFunds,
    #[msg("Invalid listing amount")]
    InvalidAmount,
}

// Events
#[event]
pub struct ListingCreated {
    pub listing_id: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub price: u64,
}

#[event]
pub struct ListingPurchased {
    pub listing_id: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub price: u64,
}

#[event]
pub struct ListingCancelled {
    pub listing_id: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
}