import puppeteer from 'puppeteer';

class InstagramScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeProfile(username) {
    const profileUrl = `https://www.instagram.com/${username}/`;
    console.log(`Scraping profile: ${profileUrl}`);

    await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
    await this.page.waitForSelector('main');

    const profileData = await this.page.evaluate(() => {
      const data = {};
      
      // Helper function to handle numbers with 'M' or 'K' suffixes
      const extractNumber = (text) => {
        if (!text) return 0;
        const lowerCaseText = text.toLowerCase();
        const numText = lowerCaseText.replace(/,/g, '');

        if (numText.endsWith('M')) {
          return parseFloat(numText) * 1000000;
        }
        if (numText.endsWith('K')) {
          return parseFloat(numText) * 1000;
        }
        return parseInt(numText, 10);
      };

      try {
        data.profilePicture = document.querySelector('header img')?.src || '';
        data.fullName = document.querySelector('header h2')?.textContent || '';
        
        const statsElements = document.querySelectorAll('header ul li');
        if (statsElements.length === 3) {
            data.postsCount = extractNumber(statsElements[0]?.textContent);
            data.followers = extractNumber(statsElements[1]?.textContent);
            data.following = extractNumber(statsElements[2]?.textContent);
        }
        
        data.bio = document.querySelector('header section > div > h1')?.textContent || document.querySelector('header section > div > span')?.textContent || '';
        
        data.recentPosts = [];
        const postElements = document.querySelectorAll('article a');

        postElements.forEach((element, index) => {
          if (index >= 12) return;

          const img = element.querySelector('img');
          const href = element.href;
          if (img && href) {
            data.recentPosts.push({
              postUrl: href,
              thumbnailUrl: img.src,
              caption: img.alt,
              likes: 0, 
              comments: 0
            });
          }
        });

      } catch (error) {
        console.error('Error while evaluating page:', error.message);
      }
      return data;
    });

    return profileData;
  }
}

export const scrapeInstagramProfile = async (username) => {
  const scraper = new InstagramScraper();
  try {
    console.log("Initializing scraper...");
    await scraper.init();
    const data = await scraper.scrapeProfile(username);
    return data;
  } catch (error) {
    console.error(`Scraping failed for ${username}:`, error);
    throw new Error(`Failed to scrape profile for ${username}.`);
  } finally {
    console.log("Closing scraper...");
    await scraper.close();
  }
};