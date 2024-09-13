export const JuseokPlainToMarkdown = (juseok: string) => {
  // 조문 추출
  let statutes = juseok.includes("\nI") ? juseok.split("\nI")[0] : juseok;
  statutes = statutes.includes("[참고문헌]")
    ? statutes.split("[참고문헌]")[0]
    : statutes;
  statutes = statutes.includes("[관련조문]")
    ? statutes.split("[관련조문]")[0]
    : statutes;

  let body = juseok.slice(statutes.length);

  statutes = statutes
    .split("\n")
    .map((x) => "> " + x)
    .slice(1)
    .join("\n");

  // 각주 변환
  body = body.replaceAll(/\$\{ \}\^\{(\d+)\}\$/g, "[^$1]");
  let footnotesMarkdown = "";
  try {
    let footnotes = body.split("<주석>")[1].split("</주석>")[0];
    body = body.split("<주석>")[0];
    let footnotesArray = footnotes.split("\n").filter((x) => x !== "");
    footnotesMarkdown = footnotesArray
      .map((x, i) => {
        return x.replace(/^(\d+)(\s*)/, "[^$1]: $2");
      })
      .join("\n");
  } catch (e) {
    footnotesMarkdown = "";
  }
  // 부제목 변환
  body = body.replaceAll("\nI", "\n## I");
  body = body.replaceAll(/\n(\d+)\. /g, "\n### $1. ");
  body = body.replaceAll(/\n([\uAC00-\uD7A3])\. /g, "\n#### $1. ");
  const markdownText = statutes + "\n\n" + body + "\n\n" + footnotesMarkdown;
  return markdownText;
};

export const indexOfAll = (str: string, searchStr: string) => {
  let i = -1;
  const indexes: number[] = [];
  while ((i = str.indexOf(searchStr, i + 1)) !== -1) {
    indexes.push(i);
  }
  return indexes;
};

export const insertAt = (str: string, sub: string, pos: number) => {
  return str.slice(0, pos) + sub + str.slice(pos);
};

export function prepareSummaryFromRaw(summaryRaw: string) {
  let summaryTemp = summaryRaw;
  if (summaryTemp.startsWith("```markdown\n")) {
    summaryTemp = summaryTemp.slice("```markdown\n".length);
  }
  if (summaryTemp.endsWith("\n```")) {
    summaryTemp = summaryTemp.slice(0, -"\n```".length);
  }
  return summaryTemp;
}

export function addSpaceAroundSlash(str) {
  return str.replace(/\/+/g, " / ");
}
