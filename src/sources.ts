export type SourceType = "publisher" | "rera" | "infrastructure" | "government" | "developer";

export type NewsSource = {
  name: string;
  type: SourceType;
  url: string;
  domain: string;
  logo: string;
  feed: boolean;
};

function source(name: string, type: SourceType, url: string, logo = ""): NewsSource {
  const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  return {
    name,
    type,
    url,
    domain,
    logo: logo || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    feed: /(?:\.rss(?:$|\?)|\.xml(?:$|\?)|\/rss(?:\/|$)|\/feed(?:\/|$)|rssfeed|rssfeeds)/i.test(url),
  };
}

// High-frequency editorial sources explicitly requested by the user.
export const CORE_SOURCES: readonly NewsSource[] = [
  source("Hindustan Times", "publisher", "https://www.hindustantimes.com", "https://www.hindustantimes.com/res/images/icons/icon-144x144.png"),
  source("The Times of India", "publisher", "https://timesofindia.indiatimes.com", "https://m.timesofindia.com/touch-icon-ipad-retina-precomposed.png"),
  source("The Economic Times", "publisher", "https://economictimes.indiatimes.com", "https://economictimes.indiatimes.com/thumb/width-120,height-120,msid-75267040/et.jpg"),
  source("ETRealty", "publisher", "https://realty.economictimes.indiatimes.com", "https://st.etb2bimg.com/Themes/Release/images/responsive/etrealty-logo-400x400.jpg"),
  source("SwarajyaMag", "publisher", "https://swarajyamag.com", "https://swarajyamag.com/icons/fav/apple-icon-144x144.png"),
];

// Additional national, business and regional editorial channels. These rotate
// through the monitor so city infrastructure and property news is not limited
// to the five high-frequency publishers above.
export const EDITORIAL_SOURCES: readonly NewsSource[] = [
  source("The Hindu", "publisher", "https://www.thehindu.com"),
  source("The Indian Express", "publisher", "https://indianexpress.com"),
  source("The New Indian Express", "publisher", "https://www.newindianexpress.com"),
  source("Business Standard", "publisher", "https://www.business-standard.com"),
  source("Financial Express", "publisher", "https://www.financialexpress.com"),
  source("Mint", "publisher", "https://www.livemint.com"),
  source("BusinessLine", "publisher", "https://www.thehindubusinessline.com"),
  source("Moneycontrol", "publisher", "https://www.moneycontrol.com"),
  source("NDTV Profit", "publisher", "https://www.ndtvprofit.com"),
  source("Construction World", "publisher", "https://www.constructionworld.in"),
  source("Realty Plus", "publisher", "https://www.rprealtyplus.com"),
  source("Deccan Herald", "publisher", "https://www.deccanherald.com"),
  source("Deccan Chronicle", "publisher", "https://www.deccanchronicle.com"),
  source("The Tribune", "publisher", "https://www.tribuneindia.com"),
  source("Telangana Today", "publisher", "https://telanganatoday.com"),
  source("News Karnataka", "publisher", "https://newskarnataka.com"),
  source("The Assam Tribune", "publisher", "https://assamtribune.com"),
  source("Odisha TV", "publisher", "https://odishatv.in"),
  source("The Statesman", "publisher", "https://www.thestatesman.com"),
  source("Free Press Journal", "publisher", "https://www.freepressjournal.in"),
];

// State RERA and equivalent official property-regulation channels for every
// state/UT present in the user's 232-pair geography whitelist.
export const RERA_SOURCES: readonly NewsSource[] = [
  source("Haryana RERA", "rera", "https://haryanarera.gov.in"),
  source("Madhya Pradesh RERA", "rera", "https://rera.mp.gov.in"),
  source("Andhra Pradesh RERA", "rera", "https://rera.ap.gov.in"),
  source("Assam RERA / GMDA", "rera", "https://gmda.assam.gov.in"),
  source("Chandigarh RERA", "rera", "http://rera.chbonline.in"),
  source("Chhattisgarh RERA", "rera", "https://rera.cgstate.gov.in"),
  source("DNH & Daman Diu Administration", "rera", "https://ddd.gov.in"),
  source("Delhi RERA", "rera", "http://rera.delhi.gov.in"),
  source("Goa RERA", "rera", "https://rera.goa.gov.in"),
  source("Gujarat RERA", "rera", "https://gujrera.gujarat.gov.in"),
  source("Jharkhand RERA", "rera", "https://jharera.jharkhand.gov.in"),
  source("Kerala RERA", "rera", "https://rera.kerala.gov.in"),
  source("Karnataka RERA", "rera", "https://rera.karnataka.gov.in"),
  source("Himachal Pradesh RERA", "rera", "https://hprera.nic.in"),
  source("Punjab RERA", "rera", "https://rera.punjab.gov.in"),
  source("Tamil Nadu RERA", "rera", "https://rera.tn.gov.in"),
  source("Telangana RERA", "rera", "https://rera.telangana.gov.in"),
  source("West Bengal RERA", "rera", "https://rera.wb.gov.in"),
  source("Tripura RERA", "rera", "https://rera.tripura.gov.in"),
  source("Maharashtra RERA", "rera", "https://maharera.maharashtra.gov.in"),
  source("Odisha RERA", "rera", "https://rera.odisha.gov.in"),
  source("Uttarakhand RERA", "rera", "https://ukrera.org.in"),
  source("Puducherry Registration Department", "rera", "https://regn.py.gov.in"),
  source("Rajasthan RERA", "rera", "https://rera.rajasthan.gov.in"),
  source("Uttar Pradesh RERA", "rera", "https://up-rera.in"),
];

// Official channels whose road, rail, airport, metro, planning, industrial,
// water and urban-development updates can materially affect real estate.
export const INFRASTRUCTURE_SOURCES: readonly NewsSource[] = [
  source("Press Information Bureau", "government", "https://www.pib.gov.in"),
  source("Ministry of Housing and Urban Affairs", "government", "https://mohua.gov.in"),
  source("Ministry of Road Transport and Highways", "infrastructure", "https://morth.nic.in"),
  source("National Highways Authority of India", "infrastructure", "https://nhai.gov.in"),
  source("NCRTC / Namo Bharat", "infrastructure", "https://ncrtc.in"),
  source("Airports Authority of India", "infrastructure", "https://www.aai.aero"),
  source("Dedicated Freight Corridor Corporation", "infrastructure", "https://dfccil.com"),
  source("Delhi Development Authority", "infrastructure", "https://dda.gov.in"),
  source("Delhi Metro Rail Corporation", "infrastructure", "https://delhimetrorail.com"),
  source("NOIDA Authority", "infrastructure", "https://noidaauthorityonline.in"),
  source("Greater Noida Authority", "infrastructure", "https://gnida.up.gov.in/en/news"),
  source("YEIDA", "infrastructure", "https://www.yamunaexpresswayauthority.com"),
  source("GMDA Gurugram", "infrastructure", "https://gmda.gov.in"),
  source("HSVP Haryana", "infrastructure", "https://www.hsvphry.org.in"),
  source("DTCP Haryana", "government", "https://tcpharyana.gov.in"),
  source("MMRDA", "infrastructure", "https://www.mmrda.maharashtra.gov.in"),
  source("CIDCO", "infrastructure", "https://cidco.maharashtra.gov.in"),
  source("PMRDA", "infrastructure", "https://www.pmrda.gov.in"),
  source("Nagpur Metro", "infrastructure", "https://www.metrorailnagpur.com"),
  source("APCRDA", "infrastructure", "https://crda.ap.gov.in"),
  source("GVMC", "infrastructure", "https://www.gvmc.gov.in"),
  source("Hyderabad Metropolitan Development Authority", "infrastructure", "https://www.hmda.gov.in"),
  source("Bangalore Development Authority", "infrastructure", "https://bda.karnataka.gov.in"),
  source("Bengaluru Metro Rail Corporation", "infrastructure", "https://english.bmrc.co.in"),
  source("Chennai Metropolitan Development Authority", "infrastructure", "https://www.cmdachennai.gov.in"),
  source("Chennai Metro Rail", "infrastructure", "https://chennaimetrorail.org"),
  source("Ahmedabad Urban Development Authority", "infrastructure", "https://auda.org.in"),
  source("Gujarat Infrastructure Development Board", "infrastructure", "https://www.gidb.org"),
  source("Kolkata Metropolitan Development Authority", "infrastructure", "https://kmda.wb.gov.in"),
  source("HIDCO West Bengal", "infrastructure", "https://www.wbhidcoltd.com"),
  source("Jaipur Development Authority", "infrastructure", "https://jda.urban.rajasthan.gov.in"),
  source("RIICO", "infrastructure", "https://riico.co.in"),
  source("Punjab Urban Planning and Development Authority", "infrastructure", "https://puda.punjab.gov.in"),
  source("Uttar Pradesh State Industrial Development Authority", "infrastructure", "https://upsida.up.gov.in"),
  source("Lucknow Development Authority", "infrastructure", "https://www.ldaonline.co.in"),
  source("Jharkhand Urban Infrastructure Development Company", "infrastructure", "https://juidco.jharkhand.gov.in"),
  source("Odisha Housing & Urban Development", "government", "https://urban.odisha.gov.in"),
  source("Bhubaneswar Development Authority", "infrastructure", "https://www.bda.gov.in"),
  source("Kochi Metro Rail", "infrastructure", "https://kochimetro.org"),
  source("Assam Guwahati Metropolitan Development Authority", "infrastructure", "https://gmda.assam.gov.in"),
  source("Goa Town and Country Planning", "government", "https://tcp.goa.gov.in"),
  source("Uttarakhand Urban Development Directorate", "government", "https://udd.uk.gov.in"),
  source("Chandigarh Administration", "government", "https://chandigarh.gov.in"),
  source("Puducherry Public Works Department", "infrastructure", "https://pwd.py.gov.in"),
];

// Official corporate sites. Google News site search discovers dated press/news
// pages; an item is still rejected unless the exact page proves an approved city,
// relevant development topic and a valid article thumbnail.
export const DEVELOPER_SOURCES: readonly NewsSource[] = [
  source("DLF Limited", "developer", "https://www.dlf.in"),
  source("M3M India", "developer", "https://m3mindia.com"),
  source("Godrej Properties", "developer", "https://www.godrejproperties.com"),
  source("Macrotech Developers / Lodha", "developer", "https://www.lodhagroup.in"),
  source("Prestige Estates Projects", "developer", "https://www.prestigeconstructions.com"),
  source("Sobha Limited", "developer", "https://www.sobha.com"),
  source("Oberoi Realty", "developer", "https://www.oberoirealty.com"),
  source("Emaar India", "developer", "https://in.emaar.com/en/media/"),
  source("Tata Housing", "developer", "https://www.tatahousing.com"),
  source("Mahindra Lifespace Developers", "developer", "https://www.mahindralifespaces.com"),
  source("Adani Realty", "developer", "https://www.adanirealty.com"),
  source("Brigade Enterprises", "developer", "https://www.brigadegroup.com"),
  source("Puravankara Limited", "developer", "https://www.puravankara.com"),
  source("Embassy Group", "developer", "https://www.embassygroup.com"),
  source("K Raheja Corp", "developer", "https://www.krahejacorp.com"),
  source("Hiranandani Group", "developer", "https://www.hiranandani.com"),
  source("Shapoorji Pallonji Real Estate", "developer", "https://www.shapoorjipallonji.com"),
  source("L&T Realty", "developer", "https://www.lntrealty.com"),
  source("Birla Estates", "developer", "https://www.birlaestates.com"),
  source("Raymond Realty", "developer", "https://raymondrealty.in"),
  source("Piramal Realty", "developer", "https://www.piramalrealty.com"),
  source("Runwal Realty", "developer", "https://www.runwal.com"),
  source("Kalpataru", "developer", "https://www.kalpataru.com"),
  source("Kolte-Patil Developers", "developer", "https://www.koltepatil.com"),
  source("Ajmera Realty", "developer", "https://www.ajmera.com"),
  source("NCC Urban", "developer", "https://www.nccurban.com"),
  source("Sattva Group", "developer", "https://sattvagroup.com"),
  source("RMZ Corp", "developer", "https://www.rmz.com"),
  source("CapitaLand India", "developer", "https://www.capitaland.com"),
  source("Sumadhura Group", "developer", "https://sumadhuragroup.com"),
  source("Casagrand", "developer", "https://www.casagrand.co.in"),
  source("TVS Emerald", "developer", "https://www.tvsemerald.com"),
  source("Radiance Realty", "developer", "https://www.radiancerealty.in"),
  source("Ramky Estates", "developer", "https://www.ramkyestates.com"),
  source("My Home Constructions", "developer", "https://www.myhomeconstructions.com"),
  source("Aparna Constructions", "developer", "https://www.aparnaconstructions.com"),
  source("Rajapushpa Properties", "developer", "https://www.rajapushpa.in"),
  source("Phoenix Group Hyderabad", "developer", "https://www.phoenixindia.net"),
  source("Rustomjee", "developer", "https://www.rustomjee.com"),
  source("Wadhwa Group", "developer", "https://www.thewadhwagroup.com"),
  source("VTP Realty", "developer", "https://www.vtprealty.in"),
  source("Kohinoor Group Pune", "developer", "https://www.kohinoorpune.com"),
  source("Signature Global", "developer", "https://www.signatureglobal.in"),
  source("Smartworld Developers", "developer", "https://smartworlddevelopers.com"),
  source("Elan Group", "developer", "https://www.elangroup.in"),
  source("BPTP", "developer", "https://www.bptp.com"),
  source("Whiteland Corporation", "developer", "https://www.whitelandcorporation.com/"),
  source("Central Park", "developer", "https://www.centralpark.in"),
  source("ATS Infrastructure", "developer", "https://www.atsgreens.com"),
  source("ACE Group", "developer", "https://www.acegroupindia.com"),
  source("County Group", "developer", "https://www.countygroup.in"),
  source("Gaurs Group", "developer", "https://www.gaursonsindia.com"),
  source("Eldeco Group", "developer", "https://www.eldecogroup.com"),
  source("Supertech", "developer", "https://www.supertechlimited.com"),
  source("Omaxe", "developer", "https://www.omaxe.com"),
  source("Sikka Group", "developer", "https://www.sikka.in"),
  source("Saya Group", "developer", "https://www.sayahomes.com"),
  source("ABA Corp", "developer", "https://www.aba-corp.com/"),
  source("Mahagun Group", "developer", "https://www.mahagunindia.com"),
  source("Shalimar Corp", "developer", "https://www.shalimarcorp.com"),
  source("Sushma Group", "developer", "https://www.sushma.co.in"),
  source("GBP Group", "developer", "https://www.gbpgroup.in"),
  source("Hero Realty", "developer", "https://www.herorealty.in"),
  source("Ashiana Housing", "developer", "https://www.ashianahousing.com"),
  source("Manglam Group", "developer", "https://www.manglamgroup.com"),
  source("Mahima Group", "developer", "https://www.mahimagroup.com"),
  source("Pacifica Companies", "developer", "https://www.pacificacompanies.co.in"),
  source("Arvind SmartSpaces", "developer", "https://www.arvindsmartspaces.com"),
  source("Shivalik Group", "developer", "https://www.shivalikgroup.com"),
  source("Bakeri Group", "developer", "https://www.bakeri.com"),
  source("PS Group", "developer", "https://www.psgroup.in"),
  source("Merlin Group", "developer", "https://www.merlinprojects.com"),
  source("Srijan Realty", "developer", "https://www.srijanrealty.com"),
  source("Ambuja Neotia", "developer", "https://www.ambujaneotia.com"),
  source("Assotech", "developer", "https://www.assotechlimited.com"),
  source("DN Homes", "developer", "https://www.dnhomes.net"),
  source("Malabar Developers", "developer", "https://www.malabardevelopers.com"),
  source("Asset Homes", "developer", "https://www.assethomes.in"),
  source("Confident Group", "developer", "https://www.confident-group.com"),
  source("Amolik Group", "developer", "https://www.amolik.com"),
];

// Exact feeds, beats and media pages supplied in the source-health report.
// Keeping their paths lets Google News queries focus on the requested beat;
// RSS URLs are fetched directly by the Worker.
export const SUPPLEMENTAL_SOURCES: readonly NewsSource[] = [
  source("MagicBricks News Feed", "publisher", "https://www.magicbricks.com/news/feed"),
  source("Hindustan Times Real Estate", "publisher", "https://www.hindustantimes.com/real-estate"),
  source("Hindustan Times Gurugram Feed", "publisher", "https://www.hindustantimes.com/feeds/rss/cities/gurugram-news/rssfeed.xml"),
  source("Hindustan Times Faridabad", "publisher", "https://www.hindustantimes.com/topic/faridabad/news"),
  source("Hindustan Times Faridabad Feed", "publisher", "https://www.hindustantimes.com/feeds/rss/cities/faridabad-news/rssfeed.xml"),
  source("Hindustan Times Real Estate Feed", "publisher", "https://www.hindustantimes.com/feeds/rss/real-estate/rssfeed.xml"),
  source("Economic Times Property", "publisher", "https://economictimes.indiatimes.com/industry/services/property-/-cstruction"),
  source("Economic Times Property Feed", "publisher", "https://economictimes.indiatimes.com/rssfeeds/13357019.cms"),
  source("Economic Times Corporate Trends", "publisher", "https://economictimes.indiatimes.com/news/company/corporate-trends"),
  source("CNBC-TV18 Real Estate", "publisher", "https://www.cnbctv18.com/real-estate/"),
  source("Times of India Real Estate", "publisher", "https://timesofindia.indiatimes.com/real-estate/news"),
  source("Times of India Real Estate Feed", "publisher", "https://timesofindia.indiatimes.com/rssfeeds/6547154.cms"),
  source("Indian Express Delhi Feed", "publisher", "https://indianexpress.com/section/cities/delhi/feed/"),
  source("ETRealty Gurugram", "publisher", "https://realty.economictimes.indiatimes.com/tag/gurugram"),
  source("ETRealty Faridabad", "publisher", "https://realty.economictimes.indiatimes.com/tag/faridabad"),
  source("ETRealty Residential", "publisher", "https://realty.economictimes.indiatimes.com/news/residential"),
  source("ETRealty Commercial", "publisher", "https://realty.economictimes.indiatimes.com/news/commercial"),
  source("ETRealty Infrastructure", "publisher", "https://realty.economictimes.indiatimes.com/news/infrastructure"),
  source("ETRealty Industry", "publisher", "https://realty.economictimes.indiatimes.com/news/industry"),
  source("ETRealty Top Stories Feed", "publisher", "https://realty.economictimes.indiatimes.com/rss/topstories"),
  source("Moneycontrol Real Estate", "publisher", "https://www.moneycontrol.com/news/business/real-estate/"),
  source("Business Standard Real Estate Feed", "publisher", "https://www.business-standard.com/rss/content/real-estate-22310.rss"),
  source("Business Standard Latest Feed", "publisher", "https://www.business-standard.com/rss/latest.rss"),
  source("Construction World Real Estate", "publisher", "https://www.constructionworld.in/latest-construction-news/real-estate-news"),
  source("Outlook Money Real Estate", "publisher", "https://www.outlookmoney.com/topic/real-estate"),
  source("Tribune Real Estate", "publisher", "https://www.tribuneindia.com/topic/real-estate"),
  source("Swarajya Stories Feed", "publisher", "https://swarajyamag.com/stories.rss"),
  source("Business of Food - Food Service", "publisher", "https://www.businessoffood.in/category/food-service/"),
  source("Torbit Realty Gurugram", "publisher", "https://torbitrealty.com/category/news/city-updates/gurugram/"),
  source("Indian Infrastructure", "publisher", "https://indianinfrastructure.com/"),
  source("Urban Transport News", "publisher", "https://urbantransportnews.com/"),
  source("Metro Rail News", "publisher", "https://www.metrorailnews.in/"),
  source("The Metro Rail Guy", "publisher", "https://themetrorailguy.com/"),
  source("Rail Analysis India", "publisher", "https://news.railanalysis.com/"),
  source("Realty & More", "publisher", "https://realtynmore.com/latest-news/"),
  source("Realty & More Feed", "publisher", "https://realtynmore.com/feed/"),
  source("RealtyNXT", "publisher", "https://realtynxt.com/"),
  source("Track2Realty", "publisher", "https://www.track2realty.track2media.com/"),
  source("Prop News Time", "publisher", "https://propnewstime.com/"),
  source("Realty Quarter Feed", "publisher", "https://realtyquarter.com/feed/"),
  source("BPTP Media", "developer", "https://www.bptp.com/media"),
  source("DLF Media", "developer", "https://www.dlf.in/media"),
  source("M3M Media", "developer", "https://m3mindia.com/media"),
  source("Smartworld Developers Media", "developer", "https://smartworlddevelopers.com/media"),
  source("Signature Global", "developer", "https://www.signatureglobal.in/"),
  source("Central Park Media", "developer", "https://www.centralpark.in/media.php"),
  source("Godrej Properties Media", "developer", "https://www.godrejproperties.com/media/press"),
  source("Max Estates Media", "developer", "https://maxestates.in/news_and_media"),
  source("Birla Estates Media", "developer", "https://www.birlaestates.com/media-centre.aspx"),
  source("Puri Constructions", "developer", "https://www.puriconstructions.com/"),
  source("Omaxe", "developer", "https://www.omaxe.com/"),
  source("RPS Group India", "developer", "https://www.rpsgroupindia.com/"),
  source("Times of India Noida Feed", "publisher", "https://timesofindia.indiatimes.com/rssfeeds/8021716.cms"),
  source("Hindustan Times Noida Feed", "publisher", "https://www.hindustantimes.com/feeds/rss/cities/noida-news/rssfeed.xml"),
  source("ETRealty Noida", "publisher", "https://realty.economictimes.indiatimes.com/tag/noida"),
  source("ETRealty Greater Noida", "publisher", "https://realty.economictimes.indiatimes.com/tag/greater%2Bnoida"),
  source("ETRealty Greater Noida AMP", "publisher", "https://realty.economictimes.indiatimes.com/amp/tag/greater%2Bnoida"),
  source("ETRealty Jewar", "publisher", "https://realty.economictimes.indiatimes.com/tag/jewar"),
  source("ETRealty Yamuna Expressway", "publisher", "https://realty.economictimes.indiatimes.com/tag/yamuna%2Bexpressway"),
  source("ETRealty Noida Airport", "publisher", "https://realty.economictimes.indiatimes.com/tag/noida%2Bairport"),
  source("ETRealty Noida Authority", "publisher", "https://realty.economictimes.indiatimes.com/tag/noida%2Bauthority"),
  source("ETRealty Greater Noida Authority", "publisher", "https://realty.economictimes.indiatimes.com/tag/greater%2Bnoida%2Bauthority"),
  source("ETRealty YEIDA", "publisher", "https://realty.economictimes.indiatimes.com/tag/yeida"),
  source("ETRealty Residential Feed", "publisher", "https://realty.economictimes.indiatimes.com/rss/residential"),
  source("ETRealty Commercial Feed", "publisher", "https://realty.economictimes.indiatimes.com/rss/commercial"),
  source("ETRealty Infrastructure Feed", "publisher", "https://realty.economictimes.indiatimes.com/rss/infrastructure"),
  source("ETRealty Industry Feed", "publisher", "https://realty.economictimes.indiatimes.com/rss/industry"),
  source("ETRealty Regulatory Feed", "publisher", "https://realty.economictimes.indiatimes.com/rss/regulatory"),
  source("Hindustan Times Noida", "publisher", "https://www.hindustantimes.com/cities/noida-news"),
  source("Hindustan Times Noida Topic", "publisher", "https://www.hindustantimes.com/topic/noida/news"),
  source("Hindustan Times Greater Noida", "publisher", "https://www.hindustantimes.com/topic/greater-noida/news"),
  source("Hindustan Times Noida Authority", "publisher", "https://www.hindustantimes.com/topic/noida-authority/news"),
  source("Hindustan Times Greater Noida Authority", "publisher", "https://www.hindustantimes.com/topic/greater-noida-authority/news"),
  source("Hindustan Times Yamuna Expressway", "publisher", "https://www.hindustantimes.com/topic/yamuna-expressway/news"),
  source("Hindustan Times Jewar Airport", "publisher", "https://www.hindustantimes.com/topic/jewar-airport/news"),
  source("Hindustan Times YEIDA", "publisher", "https://www.hindustantimes.com/topic/yeida/news"),
  source("Noida International Airport News", "infrastructure", "https://www.niairport.in/en/company/news/overview/news-overview"),
  source("YEIDA News", "infrastructure", "https://www.yamunaexpresswayauthority.com/web/"),
  source("YEIDA Announcements", "infrastructure", "https://www.yamunaexpresswayauthority.com/web/announcement/"),
  source("Greater Noida Authority Announcements", "infrastructure", "https://gnida.up.gov.in/en/announcements"),
  source("ATS Greens Blog", "developer", "https://www.atsgreens.com/blog"),
  source("Mahagun Media", "developer", "https://www.mahagunindia.com/media"),
  source("Prateek Group Blog", "developer", "https://www.prateekgroup.com/blog"),
  source("Gulshan Group", "developer", "https://www.gulshangroup.com/"),
  source("Indian Express Noida Authority", "publisher", "https://indianexpress.com/about/noida-authority/"),
  source("Indian Express Greater Noida Authority", "publisher", "https://indianexpress.com/about/greater-noida-authority/"),
  source("Times of India Noida", "publisher", "https://timesofindia.indiatimes.com/city/noida"),
];

function canonicalSourceUrl(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = (parsed.pathname.replace(/\/+$/, "") || "/").toLowerCase();
  return `${host}${path}${parsed.search}`;
}

function uniqueSources(sources: readonly NewsSource[]): NewsSource[] {
  const seen = new Set<string>();
  return sources.filter((entry) => {
    const key = canonicalSourceUrl(entry.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const ROTATING_SOURCES: readonly NewsSource[] = uniqueSources([
  ...SUPPLEMENTAL_SOURCES,
  ...EDITORIAL_SOURCES,
  ...RERA_SOURCES,
  ...INFRASTRUCTURE_SOURCES,
  ...DEVELOPER_SOURCES,
]);

export const ALL_SOURCES: readonly NewsSource[] = uniqueSources([...CORE_SOURCES, ...ROTATING_SOURCES]);
