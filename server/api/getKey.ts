import Mux from "@mux/mux-node";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { Video } = new Mux(config.MUX_TOKEN_ID, config.MUX_TOKEN_SECRET);
  const stream = await Video.LiveStreams.create({
    new_asset_settings: { playback_policy: 'public' },
    playback_policy: 'public',
  });
  return {
    key: stream.stream_key,
    playbackId: stream.playback_ids?.map((e) => e.id)
  }
})

