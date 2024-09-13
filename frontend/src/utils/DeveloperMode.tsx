export const devModeKeywordExtraction = async (
  question: string
): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lastChar = question.charAt(question.length - 1);
      if (!/\d/.test(lastChar)) {
        resolve([]);
        return;
      }
      const number = parseInt(lastChar, 10);
      const words = question.split(" ");
      resolve(words.slice(-number - 1, words.length - 1));
    }, 1500);
  });
};
