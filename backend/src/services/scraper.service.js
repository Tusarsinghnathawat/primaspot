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
      const options = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--window-size=1280,800',
          '--disable-features=site-per-process'
        ],
        ignoreHTTPSErrors: true,
      };

      // Only set executablePath in production
      if (process.env.NODE_ENV === 'production') {
        options.executablePath = '/usr/bin/google-chrome-stable';
      }

      console.log('Launching browser with options:', options);
      this.browser = await puppeteer.launch(options);

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

      // Take screenshot for debugging (best-effort, ignore failures on Windows)
      try {
        await this.page.screenshot({ path: 'page-loaded.png' });
      } catch (e) {
        console.log('Screenshot failed (ignored):', e?.message || e);
      }

      if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
      }

      // Wait for network to be idle
      await this.page.waitForNetworkIdle({ timeout: 30000 }).catch(e => console.log('Network idle timeout:', e.message));

      console.log('Waiting for main content...');
      await this.page.waitForSelector('main', { timeout: 30000 })
        .catch(async (error) => {
          console.error('Failed to find main content:', error);
          throw new Error('Could not find main content on page');
        });

      console.log('Main content found, evaluating page...');

      const profileData = await this.page.evaluate(() => {
        const data = {};
        
        const extractNumber = (text) => {
          if (!text) return 0;
          const t = text.toLowerCase().replace(/,/g, '').trim();
          // Match first number with optional decimal and optional suffix (k/m/b or words)
          const m = t.match(/([0-9]*\.?[0-9]+)\s*(k|m|b|thousand|million|billion)?/);
          if (!m) return 0;
          const val = parseFloat(m[1]);
          const suffix = m[2];
          if (!suffix) return Math.round(val);
          switch (suffix) {
            case 'k':
            case 'thousand':
              return Math.round(val * 1e3);
            case 'm':
            case 'million':
              return Math.round(val * 1e6);
            case 'b':
            case 'billion':
              return Math.round(val * 1e9);
            default:
              return Math.round(val);
          }
        };

        try {
          // Profile picture
          const imgElement = document.querySelector('header img');
          data.profilePicture = imgElement ? imgElement.src : '';
          const statsElements = document.querySelectorAll('header ul li');
          data.postsCount = 0;
          data.followers = 0;
          data.following = 0;
          
          if (statsElements.length >= 3) {
            data.postsCount = extractNumber(statsElements[0]?.textContent || '0');
            data.followers = extractNumber(statsElements[1]?.textContent || '0');
            data.following = extractNumber(statsElements[2]?.textContent || '0');
          }
          // Recent posts
          data.recentPosts = [];
          const postElements = document.querySelectorAll('article a');

          postElements.forEach((element, index) => {
            if (index >= 12) return;

            const img = element.querySelector('img');
            if (img && element.href) {
              const alt = img.alt || '';
              // Common Instagram alt pattern often contains counts, attempt to parse
              let likes = 0;
              let comments = 0;
              try {
                // e.g., "Photo by X on ..." sometimes followed by "\n123 likes, 4 comments"
                const likeMatch = alt.match(/([0-9][0-9.,]*\s*[kmb]?)(?=\s*likes?)/i);
                const commentMatch = alt.match(/([0-9][0-9.,]*\s*[kmb]?)(?=\s*comments?)/i);
                if (likeMatch && likeMatch[1]) likes = extractNumber(likeMatch[1]);
                if (commentMatch && commentMatch[1]) comments = extractNumber(commentMatch[1]);
              } catch {}

              data.recentPosts.push({
                postUrl: element.href,
                thumbnailUrl: img.src,
                caption: alt,
                likes,
                comments
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

      // Deep-scrape: visit individual post pages to extract likes/comments (best-effort)
      try {
        const limit = Math.min(10, profileData.recentPosts.length);
        for (let i = 0; i < limit; i++) {
          const post = profileData.recentPosts[i];
          if (!post?.postUrl) continue;
          // We cannot navigate from within page.evaluate; mark for outer loop
        }
      } catch (e) {
        console.log('Deep-scrape marking failed (ignored):', e?.message || e);
      }

      if (profileData.error) {
        throw new Error(`Failed to extract data: ${profileData.error}`);
      }

      if (!profileData.profilePicture && !profileData.fullName) {
        throw new Error('Failed to extract essential profile data');
      }

      // Perform deep-scrape outside of page.evaluate: navigate and extract counts
      const enriched = { ...profileData };
      try {
        const limit = Math.min(10, enriched.recentPosts.length);
        for (let i = 0; i < limit; i++) {
          const post = enriched.recentPosts[i];
          if (!post?.postUrl) continue;
          const metrics = await this.scrapePostMetrics(post.postUrl);
          if (metrics) {
            if (typeof metrics.likes === 'number') post.likes = metrics.likes;
            if (typeof metrics.comments === 'number') post.comments = metrics.comments;
          }
        }
      } catch (e) {
        console.log('Deep-scrape metrics failed (ignored):', e?.message || e);
      }

      return enriched;
    } catch (error) {
      console.error(`Error scraping profile ${username}:`, error);
      throw error;
    }
  }
}

// Helper: scrape likes/comments from a single post URL
InstagramScraper.prototype.scrapePostMetrics = async function (postUrl) {
  try {
    const p = await this.browser.newPage();
    await p.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    await p.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    });
    await p.goto(postUrl, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: 45000 });

    const counts = await p.evaluate(() => {
      const extractNumber = (text) => {
        if (!text) return 0;
        const t = text.toLowerCase().replace(/,/g, '').trim();
        const m = t.match(/([0-9]*\.?[0-9]+)\s*(k|m|b|thousand|million|billion)?/);
        if (!m) return 0;
        const val = parseFloat(m[1]);
        const suffix = m[2];
        if (!suffix) return Math.round(val);
        switch (suffix) {
          case 'k':
          case 'thousand':
            return Math.round(val * 1e3);
          case 'm':
          case 'million':
            return Math.round(val * 1e6);
          case 'b':
          case 'billion':
            return Math.round(val * 1e9);
          default:
            return Math.round(val);
        }
      };

      const result = { likes: 0, comments: 0 };

      const text = document.body ? document.body.innerText : '';
      if (text) {
        const likeMatch = text.match(/([0-9][0-9.,]*\s*[kmb]?)(?=\s*likes?)/i);
        const commentMatch = text.match(/([0-9][0-9.,]*\s*[kmb]?)(?=\s*comments?)/i);
        if (likeMatch && likeMatch[1]) result.likes = extractNumber(likeMatch[1]);
        if (commentMatch && commentMatch[1]) result.comments = extractNumber(commentMatch[1]);
      }

      // Try ARIA labels/buttons
      const possible = Array.from(document.querySelectorAll('*'))
        .map(e => e.getAttribute('aria-label'))
        .filter(Boolean)
        .join(' \n ');
      if (possible) {
        const likeMatch2 = possible.match(/([0-9][0-9.,]*\s*[kmb]?)(?=\s*likes?)/i);
        const commentMatch2 = possible.match(/([0-9][0-9.,]*\s*[kmb]?)(?=\s*comments?)/i);
        if (likeMatch2 && likeMatch2[1]) result.likes = extractNumber(likeMatch2[1]);
        if (commentMatch2 && commentMatch2[1]) result.comments = extractNumber(commentMatch2[1]);
      }

      return result;
    });

    await p.close();
    return counts;
  } catch (e) {
    console.log('scrapePostMetrics failed:', e?.message || e);
    try { /* ensure page closed */ } catch {}
    return null;
  }
};

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