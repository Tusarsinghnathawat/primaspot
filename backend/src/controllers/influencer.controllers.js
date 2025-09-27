import { scrapeInstagramProfile } from '../services/scraper.service.js';
import Influencer from '../models/influencer.model.js';

export const scrapeAndSaveInfluencer = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Instagram username is required.' });
  }

  try {
    // 1. Scrape the data
    const rawData = await scrapeInstagramProfile(username);
    console.log('Scraped Raw Data:', rawData);

    // 2. Prepare the data to match schema
    const influencerData = {
      username: username,
      fullName: rawData.fullName,
      profilePictureUrl: rawData.profilePicture,
      followers: rawData.followers,
      following: rawData.following,
      postsCount: rawData.postsCount,
      bio: rawData.bio,
      posts: rawData.recentPosts.map(post => ({
        imageUrl: post.thumbnailUrl,
        caption: post.caption,
        likes: post.likes, // will be 0 for now
        comments: post.comments, // will be 0 for now
      })),
      // We will calculate analytics in a later step
    };

    // 3. Save to the database
    // findOneAndUpdate with 'upsert' is perfect here. It will:
    // - UPDATE the influencer if they already exist.
    // - CREATE a new influencer if they do not exist.
    const savedInfluencer = await Influencer.findOneAndUpdate(
      { username: username.toLowerCase() }, // find a document with this username
      influencerData, // update it with this data
      { new: true, upsert: true } // options: return the new document, and create it if it doesn't exist
    );

    console.log(`:) Successfully saved data for ${username} to the database`);

    // 4. Send the final, saved document back as the response
    res.status(201).json({
      message: `Successfully scraped and saved data for ${username}`,
      data: savedInfluencer,
    });

  } catch (error) {
    console.error('Error in scrapeAndSaveInfluencer:', error.message);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};