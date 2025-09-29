import puppeteer from 'puppeteer';

class InstagramScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('Initializing browser with config:', {
      executable: process.env.PUPPETEER_EXECUTABLE_PATH || 'default',
      chromiumDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
    });

    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--single-process',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--window-size=1280,800'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        ignoreHTTPSErrors: true,
      });

      console.log('Browser launched successfully');
      
      this.page = await this.browser.newPage();
      console.log('New page created');

      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
      
      await this.page.setViewport({
        width: 1280,
        height: 800
      });

      await this.page.setDefaultNavigationTimeout(60000); // 60 seconds
      await this.page.setDefaultTimeout(60000);

      // Add extra headers to look more like a real browser
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      });

      console.log('Page configured successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeProfile(username) {
    const profileUrl = `https://www.instagram.com/${username}/`;
    console.log(`Scraping profile: ${profileUrl}`);

    try {
      console.log('Navigating to profile page...');
      const response = await this.page.goto(profileUrl, { 
        waitUntil: ['networkidle2', 'domcontentloaded'],
        timeout: 60000
      });

      console.log('Page response status:', response.status());

      // Take screenshot for debugging
      await this.page.screenshot({ path: '/tmp/page-loaded.png' });

      if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
      }

      // Wait for network to be idle
      await this.page.waitForNetworkIdle({ timeout: 30000 }).catch(e => console.log('Network idle timeout:', e.message));

      console.log('Waiting for main content...');
      await this.page.waitForSelector('main', { timeout: 30000 })
        .catch(async (error) => {
          console.error('Failed to find main content:', error);
          await this.page.screenshot({ path: '/tmp/error-screenshot.png' });
          throw new Error('Could not find main content on page');
        });

      console.log('Main content found, evaluating page...');

      const profileData = await this.page.evaluate(() => {
        const data = {};
        
        const extractNumber = (text) => {
          if (!text) return 0;
          const lowerCaseText = text.toLowerCase();
          const numText = lowerCaseText.replace(/,/g, '');

          if (numText.endsWith('m')) {
            return parseFloat(numText) * 1000000;
          }
          if (numText.endsWith('k')) {
            return parseFloat(numText) * 1000;
          }
          return parseInt(numText, 10) || 0;
        };

        try {
          // Profile picture
          const imgElement = document.querySelector('header img');
          data.profilePicture = imgElement ? imgElement.src : '';
          
          // Full name
          const nameElement = document.querySelector('header h2');
          data.fullName = nameElement ? nameElement.textContent.trim() : '';
          
          // Stats (posts, followers, following)
          const statsElements = document.querySelectorAll('header ul li');
          data.postsCount = 0;
          data.followers = 0;
          data.following = 0;
          
          if (statsElements.length >= 3) {
            data.postsCount = extractNumber(statsElements[0]?.textContent || '0');
            data.followers = extractNumber(statsElements[1]?.textContent || '0');
            data.following = extractNumber(statsElements[2]?.textContent || '0');
          }
          
          // Bio
          const bioElement = document.querySelector('header section > div > h1') || 
                           document.querySelector('header section > div > span');
          data.bio = bioElement ? bioElement.textContent.trim() : '';
          
          // Recent posts
          data.recentPosts = [];
          const postElements = document.querySelectorAll('article a');

          postElements.forEach((element, index) => {
            if (index >= 12) return;

            const img = element.querySelector('img');
            if (img && element.href) {
              data.recentPosts.push({
                postUrl: element.href,
                thumbnailUrl: img.src,
                caption: img.alt || '',
                likes: 0,
                comments: 0
              });
            }
          });

          console.log('Data extracted:', Object.keys(data));
          return data;
        } catch (error) {
          console.error('Error while evaluating page:', error.message);
          return { error: error.message };
        }
      });

      console.log('Page evaluation complete:', Object.keys(profileData));

      if (profileData.error) {
        throw new Error(`Failed to extract data: ${profileData.error}`);
      }

      if (!profileData.profilePicture && !profileData.fullName) {
        throw new Error('Failed to extract essential profile data');
      }

      return profileData;
    } catch (error) {
      console.error(`Error scraping profile ${username}:`, error);
      throw error;
    }
  }
}

export const scrapeInstagramProfile = async (username) => {
  const scraper = new InstagramScraper();
  try {
    console.log("Initializing scraper...");
    console.log("Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      CHROME_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'default'
    });
    await scraper.init();
    console.log("Browser initialized successfully");
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