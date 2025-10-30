/**
 * Convert YouTube URL sang embed format
 * @param url - URL gốc từ YouTube (youtu.be hoặc youtube.com)
 * @returns Embed URL hoặc URL gốc nếu không phải YouTube
 */
export const convertToYoutubeEmbed = (url: string): string => {
  if (!url) return url;

  // Regex để extract video ID từ nhiều format YouTube URL
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, // youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // Đã là embed rồi
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Nếu không match pattern nào, trả về URL gốc
  return url;
};
