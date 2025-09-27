import { Schema, model } from 'mongoose';

// First, we define a schema for the nested 'posts' array
const postSchema = new Schema({
  imageUrl: {
    type: String,
  },
  caption: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  // We can add fields for our future AI analysis here
  tags: [String],
  vibe: String,
});

//  main schema for the influencer
const influencerSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true, 
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    profilePictureUrl: {
      type: String,
    },
    bio: {
      type: String,
    },
    followers: {
      type: Number,
      default: 0,
    },
    following: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    // Placeholders for analytics we will calculate later
    avgLikes: {
      type: Number,
      default: 0,
    },
    avgComments: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    // This embeds the postSchema for an array of posts
    posts: [postSchema],
  },
  {
    timestamps: true,
  }
);

const Influencer = model('Influencer', influencerSchema);

export default Influencer;