"use client";

import { useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default function VideoPlayer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const player = videojs("my-video");

    player.ima({
      adTagUrl: "https://youradexchange.com/video/select.php?r=10790358",
    });

    return () => {
      player.dispose();
    };
  }, []);

  return (
    <video
      id="my-video"
      className="video-js vjs-default-skin"
      controls
      preload="auto"
      width="640"
      height="360"
      data-setup="{}"
    >
      <source src="/sample.mp4" type="video/mp4" />
    </video>
  );
}
