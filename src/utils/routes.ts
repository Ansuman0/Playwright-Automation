/**
 * Central route registry for the ArthaPay UI.
 *
 * All paths come from src/core/layout/appRoutes.jsx and each
 * src/modules/<feature>/routesConfig.jsx in the user's UI repo.
 *
 * Use these constants in tests instead of hard-coding strings.
 * The smoke route walk parametrizes over staticAuthRoutes().
 */

export const PublicRoutes = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  MFA_VERIFY: '/mfa-verify',
  RELOGIN: '/relogin',
  CALLBACK: '/callback',
  SILENT_REDIRECT: '/silent_redirect',
  NOVA_KYC_CALLBACK: '/nova-kyc-callback',
} as const;

export const AuthRoutes = {
  DASHBOARD: '/dashboard',
  KYC: '/kyc',
  KYB: '/kyb',
  TRANSACTIONS: '/transactions',
  NOTIFICATIONS: '/notifications',
  TOPUP: '/topup',
  IMPORT_EMPLOYEES: '/importemployees',

  PROFILE: '/profile',
  PROFILE_DETAILS: '/profile/details',
  PROFILE_ADDRESSES: '/profile/addresses',
  PROFILE_SECURITY: '/profile/security',
  PROFILE_KYC: '/profile/kyc',
  PROFILE_KYB: '/profile/kyb',
  PROFILE_FEES: '/profile/fees',
  PROFILE_FEES_MEMBERSHIPS: '/profile/fees/memberships/explore',
  PROFILE_MEMBERSHIPS: '/profile/memberships',
  PROFILE_REWARDS: '/profile/yourrewards',
  PROFILE_PAYOUT_CURRENCIES: '/profile/payout-currencies',

  CARDS: '/cards',
  CARDS_BIND: '/cards/bindcard',
  CARDS_MY: '/cards/mycards',
  CARDS_APPLY: '/cards/apply',

  WALLETS: '/wallets',
  WALLETS_CRYPTO: '/wallets/crypto',
  WALLETS_FIAT: '/wallets/fiat',

  BANKS: '/banks',
  BANKS_DEPOSIT: '/banks/deposit',
  BANKS_WITHDRAW: '/banks/withdraw',

  PAYMENTS: '/payments',
  PAYMENTS_VAULTS: '/payments/vaults',
  PAYMENTS_PAYINS: '/payments/payins',
  PAYMENTS_PAYOUTS: '/payments/payouts',
  PAYMENTS_BATCH_PAYOUTS: '/payments/batchpayouts',

  EXCHANGE: '/exchange',
  EXCHANGE_BUY: '/exchange/buy',
  EXCHANGE_SELL: '/exchange/sell',

  PAYEES: '/payees',
  PAYEES_FIAT: '/payees/fiat',
  PAYEES_CRYPTO: '/payees/crypto',
  ADDRESS_BOOK: '/addressbook',
  ADDRESS_BOOK_FIAT: '/addressbook/fiat',
  ADDRESS_BOOK_CRYPTO: '/addressbook/crypto',

  REWARDS: '/rewards',
  REWARDS_QUESTS: '/rewards/quests',
  REWARDS_QUESTS_AVAILABLE: '/rewards/quests/available',
  REWARDS_QUESTS_INPROGRESS: '/rewards/quests/inprogress',
  REWARDS_QUESTS_COMPLETED: '/rewards/quests/completed',
  REWARDS_TROPHIES: '/rewards/trophies',
  REWARDS_MYSTERY_BOXES: '/rewards/mysteryboxes',

  REFERRALS: '/referrals',
  SETTINGS_TEAM: '/settings/team',
  SETTINGS_TEAM_INVITE: '/settings/team/invite',
} as const;

// Routes with dynamic segments — the smoke walk skips these; specific
// flow tests fill in the params.
export const DynamicRoutes = {
  PROFILE_ADDRESS_MANAGE: '/profile/addresses/{id}/{mode}',
  PROFILE_MEMBERSHIP: '/profile/memberships/{id}/{name}',

  CARDS_DETAIL_VIEW: '/cards/cardsdetailview/{id}/{screen_type}',
  CARDS_PROCESS_STEPS: '/cards/processsteps/{card_id}',
  CARDS_MY_TAB: '/cards/mycards/{tab_name}',
  CARDS_MY_ACTION: '/cards/mycards/{tab_name}/{card_id}/{product_id}/{action}',
  CARDS_APPLY_DETAIL: '/cards/apply/{card_id}',
  CARDS_APPLY_STEPS: '/cards/apply/{card_id}/steps',
  CARDS_APPLY_ADDRESS: '/cards/apply/{card_id}/address',

  WALLETS_CRYPTO_ACTION: '/wallets/crypto/{action_type}',
  WALLETS_CRYPTO_DETAIL: '/wallets/crypto/{action_type}/{code}/{mrct_id}/{cust_id}',
  WALLETS_FIAT_ACTION: '/wallets/fiat/{action_type}',

  BANKS_ACCOUNT_CREATE: '/banks/account/create/{product_id}',
  BANKS_ACCOUNT_CREATE_TYPE: '/banks/account/create/{product_id}/{type}',
  BANKS_DEPOSIT_DETAILS: '/banks/deposit/{id}/details/{currency}',
  BANKS_WITHDRAW_CURRENCY: '/banks/withdraw/{currency}',

  PAYMENTS_PAYIN: '/payments/payins/payin/{id}/{vault_name}/{mode}',
  PAYMENTS_PAYOUT: '/payments/payouts/payout/{id}/{vault_name}/{mode}',
  PAYMENTS_PAYOUT_KYC: '/payments/payouts/kyc/{product_id}',
  PAYMENTS_PAYOUT_KYB: '/payments/payouts/kyb/{product_id}',
  PAYMENTS_BATCH_PAYOUT: '/payments/batchpayouts/payout/{id}/{vault}/{mode}',

  EXCHANGE_BUY_COIN: '/exchange/buy/{coin}',
  EXCHANGE_SELL_COIN: '/exchange/sell/{coin}',

  PAYEES_DETAIL: '/payees/{type}/{id}/{name}/{mode}',
  ADDRESS_BOOK_DETAIL: '/addressbook/{type}/{id}/{name}/{mode}',

  REWARDS_QUEST_DETAIL: '/rewards/quests/{state}/{quest_id}',

  REFERRALS_DETAIL: '/referrals/referrer/{ref_no}/{member}/{ref_id}',

  TEAM_MEMBER: '/settings/team/member/{member_id}/{ref_id}',
  TEAM_MEMBER_PROFILE: '/settings/team/member/{member_id}/{ref_id}/profile',
  TEAM_MEMBER_CARDS: '/settings/team/member/{member_id}/{ref_id}/cards',
  TEAM_MEMBER_TRANSACTIONS: '/settings/team/member/{member_id}/{ref_id}/transactions',
} as const;

export function staticAuthRoutes(): string[] {
  return Object.values(AuthRoutes);
}

export function publicRoutes(): string[] {
  return Object.values(PublicRoutes);
}
