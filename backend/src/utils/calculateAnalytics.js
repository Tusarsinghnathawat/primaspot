export const calculateAverages = (posts = []) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return { avgLikes: 0, avgComments: 0 };
  }
  const totals = posts.reduce(
    (acc, p) => {
      acc.likes += Number(p.likes || 0);
      acc.comments += Number(p.comments || 0);
      return acc;
    },
    { likes: 0, comments: 0 }
  );
  const count = posts.length;
  return {
    avgLikes: Math.round(totals.likes / count),
    avgComments: Math.round(totals.comments / count),
  };
};

export const calculateEngagementRate = ({ avgLikes = 0, avgComments = 0, followers = 0 }) => {
  if (!followers || followers <= 0) return 0;
  // Engagement rate (%) per post: (avgLikes + avgComments) / followers * 100
  const rate = ((Number(avgLikes) + Number(avgComments)) / Number(followers)) * 100;
  // Keep two decimals
  return Number(rate.toFixed(2));
};

export const computeAnalytics = (posts = [], followers = 0) => {
  const { avgLikes, avgComments } = calculateAverages(posts);
  const engagementRate = calculateEngagementRate({ avgLikes, avgComments, followers });
  return { avgLikes, avgComments, engagementRate };
};

export default computeAnalytics;
