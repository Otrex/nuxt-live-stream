<template>
  <div class="flex items-center justify-center w-full h-screen">
    <div class="flex-row block gap-6 md:inline-flex">
      <div class="md:w-[50rem] w-[30rem] aspect-video relative">
        <video
          :class="[
            'w-full h-full rounded-xl bg-black border-4',
            isStreaming ? 'border-green-500' : 'border-red-600',
          ]"
          muted
          playsInline
          ref="videoRef"
        ></video>
        <div
          class="absolute top-0 flex flex-col justify-between w-full h-full"
          id="overlay"
        >
          <div class="absolute top-5 left-5">
            <div
              :class="[
                'rounded-full w-[1.5rem] aspect-square',
                isStreaming ? 'bg-green-500' : 'bg-red-600',
              ]"
            >
              &nbsp;
            </div>
          </div>
          <div class="flex items-center justify-between p-4 px-6 text-white">
            <div> &nbsp;</div>
            <div class="" v-show="!isStreaming">
              <div
                class="px-4 py-2 text-right border border-white"
                @click="showDeviceList = !showDeviceList"
              >
                Audio/Video devices
              </div>
              <div v-show="showDeviceList" class="text-black bg-white">
                <h2 class="font-semibold">Video Devices</h2>
                <hr />
                <template v-for="(device, idx) in devices.video" :key="idx">
                  <div
                    @click="() => selectDevice('video', device.deviceId)"
                    class="hover:bg-slate-400"
                  >
                    {{ device.label }}
                  </div>
                </template>
                <hr />
                <h2 class="font-semibold">Audio Devices</h2>
                <hr />
                <template v-for="(device, idx) in devices.audio" :key="idx">
                  <div
                    @click="() => selectDevice('audio', device.deviceId)"
                    class="hover:bg-slate-400"
                  >
                    {{ device.label }}
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div class="flex justify-center w-full gap-6 py-8">
            <button
              class="w-16 text-white border border-white rounded-full md:w-20 aspect-square disabled:border-red-400 disabled:text-red-400"
              :disabled="!isDeviceEnabled.audio"
              @click="() => toggleDisableTrack('audio')"
              v-show="!isStreaming"
            >
              Mic
            </button>
            <button
              class="w-16 text-white border border-white rounded-full md:w-20 aspect-square disabled:border-red-400 disabled:text-red-400"
              :disabled="!isDeviceEnabled.video"
              @click="() => toggleDisableTrack('video')"
              v-show="!isStreaming"
            >
              Video
            </button>
          </div>
          <div
            v-show="isStreaming"
            :class="[
              'w-full mt-9 absolute',
              '-bottom-[50px] p-4',
              'border-4 border-t-0 bg-black',
              isStreaming
                ? 'border-x-green-500 border-b-green-500 '
                : 'border-x-red-500 border-b-red-500',
            ]"
          >
            <div class="flex items-center justify-between w-full">
              <div>
                <input
                  type="button"
                  class="px-4 py-2 text-white border border-white"
                  value="Stop Streaming"
                  @click="stopStreaming"
                />
              </div>
              <div class="text-white">
                {{ elapsedTime || "00:00:00" }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center w-full text-center md:text-left md:w-auto" v-show="!isStreaming">
        <div class="w-full">
          <h1 class="mb-4 text-4xl font-bold">Ready to join?</h1>
          <div class="inline-block w-1/2">
            <span class="text-sm">STREAM KEY</span>
            <input
              type="text"
              v-model="streamKey"
              class="p-2 border border-gray-400 rounded-lg"
            />
          </div>
          <div class="mt-2">
            <input
              v-show="streamKey"
              type="button"
              class="px-6 py-2 text-white bg-blue-500 rounded-lg"
              @click="startStreaming"
              value="Start Streaming"
            />
            <input
              v-show="!streamKey"
              type="button"
              class="px-6 py-2 text-white bg-green-500 rounded-lg"
              @click="getKeys"
              value="Generate Key"
            />
          </div>
          <div class="mt-2" v-if="streamCredential && streamCredential.playbackId.length">
            Share this PlaybackID to view the stream
            <br/>
            <code> 
              {{ streamCredential?.playbackId[0] }}
            </code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Timer from "~~/utils/Timer";

const videoRef = ref();
const isStreaming = ref();
const isWSconnected = ref();
const inputStreamRef = ref();
const showDeviceList = ref();
const streamKey = ref();
const websocket = ref();
const mediaRecorderRef = ref();
const recorderSettings = ref();

const timer = ref();
const elapsedTime = ref();

const streamCredential = ref();

const devices = reactive({
  video: [],
  audio: [],
});

const selectedDevices = reactive({
  video: null,
  audio: null,
});

const isDeviceEnabled = reactive({
  video: true,
  audio: true,
});

const constraints = reactive({
  audio: true,
  video: true,
});

onMounted(() => {
  getRecorderSettings();
  enableCamera();
  getDevices();

  timer.value = new Timer();
});

async function getKeys() {
  const { data } = await useFetch('/api/getKey')
  streamCredential.value = data.value;
  streamKey.value = data.value.key;
}

function getDevices() {
  navigator.mediaDevices.enumerateDevices().then(function (d) {
    devices.video = d.filter((e) => e.kind === "videoinput");
    devices.audio = d.filter((e) => e.kind === "audioinput");
  });
}

function setConstraints(type, newValue) {
  constraints[type] = newValue;
  enableCamera();
}

function selectDevice(type, deviceId) {
  selectedDevices[type] = { deviceId };
  setConstraints(type, { deviceId });
  showDeviceList.value = false;
}

function toggleDisableTrack(type) {
  if (isDeviceEnabled[type]) {
    setConstraints(type, false);
    isDeviceEnabled[type] = false;
  } else {
    setConstraints(type, selectedDevices[type] || true);
    isDeviceEnabled[type] = true;
  }
}

function getRecorderSettings() {
  const video = MediaRecorder.isTypeSupported("video/webm;codecs=h264")
    ? "h264"
    : "vp8";
  const codecs = `;codecs=${video}, opus`;

  const result = MediaRecorder.isTypeSupported("video/mp4")
    ? {
        format: "mp4",
        video: "h264", // Know what this means
        audio: "aac",
        codecs: "",
        mimeType: "video/mp4",
      }
    : {
        video,
        format: "webm",
        audio: "opus",
        codecs,
        mimeType: `video/webm${codecs}`,
      };

  recorderSettings.value = result;
}

function stopStreaming() {
  if (mediaRecorderRef.value?.state === "recording") {
    mediaRecorderRef.value.stop();
  }
  timer.value.stop()
  timer.value.reset()
  elapsedTime.value = null;
  isStreaming.value = false;
}

function startStreaming() {
  try {
    if (!streamKey.value) return alert("Please enter a stream key");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = new URL(`${protocol}//${window.location.host}`);

    wsUrl.searchParams.set("key", streamKey.value);
    wsUrl.searchParams.set("video", recorderSettings.value?.video);
    wsUrl.searchParams.set("audio", recorderSettings.value?.audio);

    websocket.value = new WebSocket(wsUrl);

    websocket.value.addEventListener("open", () => {
      isWSconnected.value = true;
    });

    websocket.value.addEventListener("close", () => {
      isWSconnected.value = false;
      stopStreaming();
    });

    const audioStream = new MediaStream();
    const audioTracks = inputStreamRef.value.getAudioTracks();

    const videoStream = new MediaStream();
    const videoTracks = inputStreamRef.value.getVideoTracks();

    // Added tracks from the media input stream ref to the audioStrem
    audioTracks.forEach(function (track) {
      audioStream.addTrack(track);
    });

    videoTracks.forEach(function (track) {
      videoStream.addTrack(track);
    });

    // created outputStream to add both the video and audiio streams together
    const outputStream = new MediaStream();
    [audioStream, videoStream].forEach(function (s) {
      s.getTracks().forEach(function (t) {
        outputStream.addTrack(t);
      });
    });

    mediaRecorderRef.value = new MediaRecorder(outputStream, {
      mimeType: recorderSettings.value?.mimeType,
      videoBitsPerSecond: 3000000,
      audioBitsPerSecond: 64000,
    });

    mediaRecorderRef.value.addEventListener("dataavailable", (e) => {
      console.log(e);
      websocket.value.send(e.data);
    });

    mediaRecorderRef.value.addEventListener("stop", () => {
      stopStreaming();
      websocket.value.close();
    });

    mediaRecorderRef.value.start(1000);

    timer.value.start(0, (time) => {
      elapsedTime.value = Timer.toTimeString(time)
    })
    isStreaming.value = true;
  } catch (err) {
    console.log(err);
    alert("An Error Occured!! Refer to console for more details")
  }
  
}

const enableCamera = async () => {
  inputStreamRef.value = await navigator.mediaDevices.getUserMedia(constraints);

  videoRef.value.srcObject = inputStreamRef.value;
  await videoRef.value.play();
};
</script>
