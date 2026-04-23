export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  verified: boolean; // true if user purchased the product
  helpful: number; // count of helpful votes
  notHelpful: number; // count of not helpful votes
  userHelpfulVotes: string[]; // array of user IDs who voted helpful
  userNotHelpfulVotes: string[]; // array of user IDs who voted not helpful
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

export type ReviewSortBy = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
export type ReviewFilter = 'all' | '5' | '4' | '3' | '2' | '1' | 'verified';