import { WebSocketServer } from "ws"
import { defineNuxtModule } from '@nuxt/kit'
import child_process from 'child_process';
import url from 'url';

const mstr = (str: any) => str || ""

export default defineNuxtModule({
  setup(options, nuxt) {
    nuxt.hook('listen', (server) => {
      const wss = new WebSocketServer({ server });

      wss.on('connection', (ws, req) => {
        console.log('Streaming socket connected');
        ws.send('Streaming socket connected');

        const params = new URLSearchParams(mstr(url.parse(mstr(req.url)).search));
        const [ key, video, audio ] = ['key', 'video', 'audio'].map((k) => params.get(k));

        const rtmpUrl = `rtmps://global-live.mux.com/app/${key}`;

        const codecs = [
          ...(video === 'h264' ? [ '-c:v', 'copy'] : ['-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-vf', 'scale=w=-2:0']),
          ...(audio === 'aac' ? [ '-c:a', 'copy'] : ['-c:a', 'aac', '-ar', '44100', '-b:a', '64k'])
        ]

        const ffmpeg = child_process.spawn('ffmpeg', [
          '-i','-', '-y', '-async', '1', ...codecs,
          '-bufsize', '1000', '-f', 'flv', rtmpUrl
        ]);

        ffmpeg.stdin.on('error', (e) => {
          console.log('An error occured!! ', e);
        });

        // This occures when ffmpeg returns an error in the stream.
        ffmpeg.stderr.on('data', (data) => {
          console.log('FFmpeg STDERR:', data.toString());
        });

        // Kill the WebSocket connection if ffmpeg dies.
        ffmpeg.on('close', (code, signal) => {
          console.log(`ffmpeg process closed!!, code ${code}, signal ${signal}`);
          ws.terminate();
        });

        ws.on('message', (message) => {
          ffmpeg.stdin.write(message);
        });

        ws.on('close', e => {
          ffmpeg.kill('SIGINT');
          console.log('Stopped FFMPEG!!');
        });
      })
    })
  }
})