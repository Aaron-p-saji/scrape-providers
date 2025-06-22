import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { HlsBasedStream } from '@/providers/streams';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const foxBaseUrl = 'https://backend.xprime.tv/fox';
const apolloBaseUrl = 'https://kendrickl-3amar.site';
const showboxBaseUrl = 'https://backend.xprime.tv/primebox';
const marantBaseUrl = 'https://backend.xprime.tv/marant';
const krakenBaseUrl = 'https://backend.xprime.tv/kraken';
const primenetBaseUrl = 'https://backend.xprime.tv/primenet';
const volkswagenBaseUrl = 'https://backend.xprime.tv/volkswagen';
const harbourBaseUrl = 'https://backend.xprime.tv/harbour';
const fendiBaseUrl = 'https://backend.xprime.tv/fendi';
const rageBaseUrl = 'https://backend.xprime.tv/rage';
const languageMap = {
  'chinese - hong kong': 'zh',
  'chinese - traditional': 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  'english - sdh': 'en',
  finnish: 'fi',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hungarian: 'hu',
  italian: 'it',
  korean: 'ko',
  norwegian: 'no',
  polish: 'pl',
  portuguese: 'pt',
  'portuguese - brazilian': 'pt',
  romanian: 'ro',
  'spanish - european': 'es',
  'spanish - latin american': 'es',
  swedish: 'sv',
  turkish: 'tr',
  اَلْعَرَبِيَّةُ: 'ar',
  বাংলা: 'bn',
  filipino: 'tl',
  indonesia: 'id',
  اردو: 'ur',
  English: 'en',
  Arabic: 'ar',
  Bosnian: 'bs',
  Bulgarian: 'bg',
  Croatian: 'hr',
  Czech: 'cs',
  Danish: 'da',
  Dutch: 'nl',
  Estonian: 'et',
  Finnish: 'fi',
  French: 'fr',
  German: 'de',
  Greek: 'el',
  Hebrew: 'he',
  Hungarian: 'hu',
  Indonesian: 'id',
  Italian: 'it',
  Norwegian: 'no',
  Persian: 'fa',
  Polish: 'pl',
  Portuguese: 'pt',
  'Protuguese (BR)': 'pt-br',
  Romanian: 'ro',
  Russian: 'ru',
  Serbian: 'sr',
  Slovenian: 'sl',
  Spanish: 'es',
  Swedish: 'sv',
  Thai: 'th',
  Turkish: 'tr',
};
export const xprimeApolloEmbed = makeEmbed({
  id: 'xprime-apollo',
  name: 'Appolo',
  rank: 239,
  scrape: async (ctx) => {
    const query = JSON.parse(ctx.url);
    let url = `${apolloBaseUrl}/${query.tmdbId}`;
    if (query.type === 'show') {
      url += `/${query.season}/${query.episode}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    const captions = (data.subtitles ?? []).map((sub: { file: any; label: string }, index: any) => ({
      id: `caption-${index}`, // You can generate a better ID if available
      type: 'vtt',
      url: sub.file,
      language: languageMap[sub.label.toLowerCase() as keyof typeof languageMap] || 'unknown',
      hasCorsRestrictions: false, // or true, depending on your source
    }));

    ctx.progress(90);

    const stream: HlsBasedStream = {
      type: 'hls',
      id: 'primary',
      playlist: data.url,
      flags: [flags.CORS_ALLOWED],
      captions,
    };

    if (data.thumbnails?.file) {
      stream.thumbnailTrack = {
        type: 'vtt',
        url: data.thumbnails.file,
      };
    }

    return {
      stream: [stream],
    };
  },
});
export const xprimeStreamboxEmbed = makeEmbed({
  id: 'xprime-streambox',
  name: 'Streambox',
  rank: 238,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    let url = `${showboxBaseUrl}?name=${query.title}&year=${query.releaseYear}&fallback_year=${query.releaseYear}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.streams) throw new NotFoundError('No streams found in response');
    const subs = data.subtitle;
    const captions =
      (subs == null
        ? null
        : subs.map((sub: { label: string; file: string }) => ({
            id: sub.label,
            url: sub.file,
            language: languageMap[sub.label.toLowerCase() as keyof typeof languageMap] || 'unknown',
            type: 'srt',
          }))) || [];
    const qualityMap: Record<string, { type: string; url: string }> = {};

    Object.entries(data.streams).forEach(([key, value]) => {
      const normalizedKey: string = key.toLowerCase().replace('p', '');
      qualityMap[normalizedKey] = {
        type: 'mp4',
        url: value as string,
      };
    });
    return {
      stream: [
        {
          id: 'primary',
          captions,
          qualities: qualityMap,
          type: 'file',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
export const xprimePrimenetEmbed = makeEmbed({
  id: 'xprime-primenet',
  name: 'Primenet',
  rank: 236,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    let url = `${primenetBaseUrl}?id=${query.tmdbId}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    ctx.progress(90);
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
export const xprimeKrakenEmbed = makeEmbed({
  id: 'xprime-kraken',
  name: 'Kraken',
  rank: 237,
  async scrape(ctx) {
    let _a;
    const query = JSON.parse(ctx.url);
    let url = `${krakenBaseUrl}?id=${query.tmdbId}&name=${encodeURIComponent(query.title)}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}&eid=${query.episodeId || ''}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    const val = data.subtitle;
    const captions =
      (val == null
        ? null
        : val.map((sub: { label: string; file: string }) => ({
            type: 'vtt',
            url: sub.file,
            language: languageMap[sub.label.toLowerCase() as keyof typeof languageMap] || 'unknown',
          }))) || [];
    ctx.progress(90);
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
export const xprimePhoenixEmbed = makeEmbed({
  id: 'xprime-phoenix',
  name: 'Phoenix',
  rank: 235,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams();
    params.append('id', query.tmdbId);
    params.append('imdb', query.imdbId);
    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }
    const url = `https://backend.xprime.tv/phoenix?${params.toString()}`;
    ctx.progress(50);
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    ctx.progress(90);
    const captions = data.subtitles
      ? data.subtitles.map((sub: { label: string; file: string }) => {
          const baseLabel = sub.label.split(' ')[0];
          const langCode =
            languageMap[baseLabel as keyof typeof languageMap] || baseLabel.toLowerCase().substring(0, 2);
          return {
            id: `${sub.label.replace(/\s+/g, '_').toLowerCase()}`,
            language: langCode,
            url: sub.file,
            label: sub.label,
            type: 'vtt',
          };
        })
      : [];
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
export const xprimeFoxEmbed = makeEmbed({
  id: 'xprime-fox',
  name: 'Fox',
  rank: 234,
  async scrape(ctx) {
    let _a;
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      name: query.title,
      pstream: 'true',
    });
    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }
    const apiRes = await ctx.fetcher(`${foxBaseUrl}?${params.toString()}`);
    if (!apiRes) throw new NotFoundError('No response received');
    const data = await JSON.parse(apiRes);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    const val = data.subtitles;
    const captions =
      (val == null
        ? null
        : val.map((sub: { label: string; file: string }) => ({
            type: 'vtt',
            url: sub.file,
            language: languageMap[sub.label.toLowerCase() as keyof typeof languageMap] || 'unknown',
          }))) || [];
    ctx.progress(90);
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: `https://oca.kendrickl-3amar.site/?v=${encodeURIComponent(data.url)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://megacloud.store/', origin: 'https://megacloud.store' }))}`,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
export const xprimeHarbourEmbed = makeEmbed({
  id: 'xprime-harbour',
  name: 'Harbour',
  rank: 233,
  async scrape(ctx) {
    let _a;
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      name: query.title,
      year: query.releaseYear.toString(),
    });
    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }
    const apiRes = await ctx.fetcher(`${harbourBaseUrl}?${params.toString()}`);
    if (!apiRes) throw new NotFoundError('No response received');
    const data = await JSON.parse(apiRes);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    const val = data.subtitles;
    const captions =
      (val == null
        ? null
        : val.map((sub: { label: string; file: string }) => ({
            type: 'vtt',
            url: sub.file,
            language: languageMap[sub.label.toLowerCase() as keyof typeof languageMap] || 'unknown',
          }))) || [];
    ctx.progress(90);
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
type StreamData = string;
type SSDa = {
  '4K': StreamData;
  '1080P': StreamData;
  '720P': StreamData;
  '480P': StreamData;
  '360P': StreamData;
};
type Stream = SSDa | object;

export const xprimeRageEmbed = makeEmbed({
  id: 'xprime-rage',
  name: 'Rage (4K)',
  rank: 232,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    let url = `${rageBaseUrl}?imdb=${query.imdbId}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    const streams: Record<string, string> = {};
    if (data.quality === '4K') {
      streams['4K'] = data.url;
    } else if (data.quality) {
      streams[`${data.quality}P`] = data.url;
    } else {
      streams.ORG = data.url;
    }
    const filteredStreams = Object.entries(streams).reduce<Record<number | string, string>>(
      (acc, [quality, streamUrl]) => {
        let qualityKey: number | string;

        if (quality === 'ORG') {
          const urlPath = streamUrl.split('?')[0];
          if (urlPath.toLowerCase().endsWith('.mp4')) {
            acc.unknown = streamUrl;
          }
          return acc;
        }

        if (quality === '4K') {
          qualityKey = 2160;
        } else {
          qualityKey = parseInt(quality.replace('P', ''), 10);
        }

        if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;

        acc[qualityKey] = streamUrl;
        return acc;
      },
      {}, // Initial value for reduce
    );

    ctx.progress(90);
    return {
      stream: [
        {
          id: 'primary',
          captions: [],
          qualities: {
            ...(filteredStreams[2160] && {
              '4k': {
                type: 'mp4',
                url: filteredStreams[2160],
              },
            }),
            ...(filteredStreams[1080] && {
              1080: {
                type: 'mp4',
                url: filteredStreams[1080],
              },
            }),
            ...(filteredStreams[720] && {
              720: {
                type: 'mp4',
                url: filteredStreams[720],
              },
            }),
            ...(filteredStreams[480] && {
              480: {
                type: 'mp4',
                url: filteredStreams[480],
              },
            }),
            ...(filteredStreams[360] && {
              360: {
                type: 'mp4',
                url: filteredStreams[360],
              },
            }),
            ...(filteredStreams.unknown && {
              unknown: {
                type: 'mp4',
                url: filteredStreams.unknown,
              },
            }),
          },
          type: 'file',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
export const xprimeFendiEmbed = makeEmbed({
  id: 'xprime-fendi',
  name: 'Fendi (Italian + English)',
  rank: 231,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    let url = `${fendiBaseUrl}?id=${query.tmdbId}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    ctx.progress(90);
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
export const xprimeMarantEmbed = makeEmbed({
  id: 'xprime-marant',
  name: 'Marant (French + English)',
  rank: 230,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    let url = `${marantBaseUrl}?id=${query.tmdbId}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');
    ctx.progress(90);
    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
export const xprimeVolkswagenEmbed = makeEmbed({
  id: 'xprime-volkswagen',
  name: 'Volkswagen (German)',
  rank: 229,
  async scrape(ctx) {
    const query = JSON.parse(ctx.url);
    let url = `${volkswagenBaseUrl}?name=${query.title}`;
    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    } else {
      url += `&year=${query.releaseYear}`;
    }
    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.streams) throw new NotFoundError('No streams found in response');
    const qualityMap: Record<string, { type: string; url: string }> = {};
    Object.entries(data.streams).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase().replace('p', '');
      qualityMap[normalizedKey] = {
        type: 'mp4',
        url: value as string,
      };
    });
    ctx.progress(90);
    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED],
          qualities: qualityMap,
          captions: [],
        },
      ],
    };
  },
});
