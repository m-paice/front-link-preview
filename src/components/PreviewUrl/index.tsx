import React, { useEffect, useState } from "react";

import { fetch } from "cross-fetch";
import urlObj from "url";
// @ts-ignore
import cheerio from "cheerio-without-node-native";

import "./style.css";

interface Props {
  url: string;
}

export const CONSTANTS = {
  REGEX_CONTENT_TYPE_IMAGE: new RegExp("image/.*", "i"),

  REGEX_CONTENT_TYPE_AUDIO: new RegExp("audio/.*", "i"),

  REGEX_CONTENT_TYPE_VIDEO: new RegExp("video/.*", "i"),

  REGEX_CONTENT_TYPE_TEXT: new RegExp("text/.*", "i"),

  REGEX_CONTENT_TYPE_APPLICATION: new RegExp("application/.*", "i"),
};

function getDefaultFavicon(rootUrl: string) {
  return urlObj.resolve(rootUrl, `/favicon.ico`);
}

function parseImageResponse(url: string, contentType: string | null) {
  return {
    url,
    mediaType: `image`,
    contentType,
    favicons: [getDefaultFavicon(url)],
  };
}

function getTitle(doc: any) {
  let title = doc(`meta[property='og:title']`).attr(`content`);

  if (!title) {
    title = doc(`title`).text();
  }

  return title;
}

function getDescription(doc: any) {
  let description = doc(`meta[name=description]`).attr(`content`);

  if (description === undefined) {
    description = doc(`meta[name=Description]`).attr(`content`);
  }

  if (description === undefined) {
    description = doc(`meta[property='og:description']`).attr(`content`);
  }

  return description;
}

function getImages(doc: any, rootUrl: string, imagesPropertyType?: string) {
  let images: string[] = [];
  let nodes;
  let src;
  let dic: Record<string, boolean> = {};

  const imagePropertyType = imagesPropertyType ?? `og`;
  nodes = doc(`meta[property='${imagePropertyType}:image']`);

  if (nodes.length) {
    nodes.each((_: number, node: any) => {
      src = node.attribs.content;
      if (src) {
        src = urlObj.resolve(rootUrl, src);
        images.push(src);
      }
    });
  }

  if (images.length <= 0 && !imagesPropertyType) {
    src = doc(`link[rel=image_src]`).attr(`href`);
    if (src) {
      src = urlObj.resolve(rootUrl, src);
      images = [src];
    } else {
      nodes = doc(`img`);

      if (nodes.length) {
        dic = {};
        images = [];
        nodes.each((_: number, node: any) => {
          src = node.attribs.src;
          if (src && !dic[src]) {
            dic[src] = true;
            // width = node.attribs.width;
            // height = node.attribs.height;
            images.push(urlObj.resolve(rootUrl, src));
          }
        });
      }
    }
  }

  return images;
}

function getVideos(doc: any) {
  const videos = [];
  let nodeTypes;
  let nodeSecureUrls;
  let nodeType;
  let nodeSecureUrl;
  let video;
  let videoType;
  let videoSecureUrl;
  let width;
  let height;
  let videoObj;
  let index;

  const nodes = doc(`meta[property='og:video']`);
  const { length } = nodes;

  if (length) {
    nodeTypes = doc(`meta[property='og:video:type']`);
    nodeSecureUrls = doc(`meta[property='og:video:secure_url']`);
    width = doc(`meta[property='og:video:width']`).attr(`content`);
    height = doc(`meta[property='og:video:height']`).attr(`content`);

    for (index = 0; index < length; index += 1) {
      video = nodes[index].attribs.content;

      nodeType = nodeTypes[index];
      videoType = nodeType ? nodeType.attribs.content : null;

      nodeSecureUrl = nodeSecureUrls[index];
      videoSecureUrl = nodeSecureUrl ? nodeSecureUrl.attribs.content : null;

      videoObj = {
        url: video,
        secureUrl: videoSecureUrl,
        type: videoType,
        width,
        height,
      };
      if (videoType && videoType.indexOf(`video/`) === 0) {
        videos.splice(0, 0, videoObj);
      } else {
        videos.push(videoObj);
      }
    }
  }

  return videos;
}

function getSiteName(doc: any) {
  const siteName = doc(`meta[property='og:site_name']`).attr(`content`);

  return siteName;
}

function parseTextResponse(
  body: string,
  url: string,
  options: {
    imagesPropertyType?: string;
  } = {},
  contentType?: string
) {
  const doc = cheerio.load(body);

  return {
    url,
    title: getTitle(doc),
    siteName: getSiteName(doc),
    description: getDescription(doc),
    // mediaType: getMediaType(doc) || `website`,
    // contentType,
    images: getImages(doc, url, options.imagesPropertyType),
    videos: getVideos(doc),
    // favicons: getFavicons(doc, url),
  };
}

const getLinkPreview = async (url: string, options?: {}) => {
  const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);

  const finalUrl = response.url;

  let contentType = response.headers.get(`content-type`) || "";

  console.log("contentType: ", contentType);

  if (CONSTANTS.REGEX_CONTENT_TYPE_IMAGE.test(contentType)) {
    return parseImageResponse(finalUrl, contentType);
  }
  if (CONSTANTS.REGEX_CONTENT_TYPE_TEXT.test(contentType)) {
    const htmlString = await response.text();
    console.log(htmlString)
    return parseTextResponse(htmlString, finalUrl, options, contentType);
  }

  return response;
};

const PreviewUrl: React.FC<Props> = ({ url }) => {
  const [data, setDate] = useState<any>(null);

  useEffect(() => {
    const fetch = async (url: string) => {
      const response = await getLinkPreview(url);

      setDate(response);
    };
    fetch(url);
  }, [url]);

  if (!data) return <p>loading...</p>;

  return (
    <div className="container">
      <div className="content">
        <div>
          <img src={data.images[0]} alt="image" />
        </div>
        <div>
          <h1>{data.siteName}</h1>
          <p>{data.title}</p>
          <p>{data.description}</p>
        </div>
      </div>
    </div>
  );
};

export default PreviewUrl;
