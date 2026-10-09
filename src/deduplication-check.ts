import { isNearDuplicateHeadline } from "./deduplication";
import { isRelevant } from "./index";

const articleTitle = "80 लाख की जमीन खरीदने वाली पटवारी को नोटिस: छिंदवाड़ा में शिकायत के बाद SDM ने मांगा जवाब, बेनामी संपत्ति औ...";
const videoTitle = "छिंदवाड़ा में शिकायत के बाद SDM ने मांगा जवाब, बेनामी संपत्ति और आय के स्रोत की जांच शुरू";

if (!isNearDuplicateHeadline(articleTitle, videoTitle)) {
  throw new Error("Hindi article/video duplicate was not detected");
}
if (isRelevant(articleTitle)) throw new Error("Benami-property investigation was incorrectly relevant");
if (isRelevant("Stocks to watch: TCS, Infosys, Wipro, Anand Rathi, KEC, NCC and BEML")) {
  throw new Error("Stock-market story was incorrectly relevant");
}

console.log("Deduplication and relevance regression checks passed");
