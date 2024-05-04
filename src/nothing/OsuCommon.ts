import WebAudioScheduler from "web-audio-scheduler";
import { HelperFunctions } from "whiskerweb";

const Settings = {
  DEBUG: {
    enabled: true,
  },
  osuDefaults: {
    ApproachRate: 5,
  },
};

if (!global) {
  window.global = window;
}

export interface OsuHitObject {
  extras: {
    sampleSet: string;
    additionalSet: number;
    customIndex: number;
    sampleVolume: number;
    filename: string;
  };
  hitSound: {
    normal: boolean;
    whistle: boolean;
    finish: boolean;
    clap: boolean;
  };
  time: number;
  type: { isNewCombo: boolean; isOsuMania: boolean; type: string };
  x: number;
  y: number;
}

export interface OsuFile {
  Difficulty: {
    ApproachRate: number;
    CircleSize: number;
    HPDrainRate: number;
    OverallDifficulty: number;
    SliderMultiplier: number;
    SliderTickRate: number;
  };
  Editor: {
    Bookmarks: number;
    DistanceSpacing: number;
    BeatDivisor: number;
    GridSize: number;
    TimelineZoom: number;
  };
  Events: Array<unknown>;
  General: {
    AudioFilename: string;
    AudioLeadIn: number;
    PreviewTime: number;
    Countdown: number;
    SampleSet: string;
  };
  HitObjects: Array<OsuHitObject>;
  Metadata: {
    Title: string;
    TitleUnicode: string;
    Artist: string;
    ArtistUnicode: string;
    Creator: string;
  };
  RequiredFiles: Array<string>;
  TimingPoints: Array<{
    inherited: boolean;
    kiai: boolean;
    meter: number;
    mpb: number;
    offset: number;
    sampleIndex: number;
    sampleSet: string;
    volume: number;
  }>;
  version: number;
}

/**
 * Class of common functions between Osu! game types (currently legacy/regular and osu!mania)
 */
export class OsuCommon {
  static __AUDIOCTX: AudioContext;
  static __AUDIOGAIN: any;
  static __AUDIOSRC: AudioBufferSourceNode;
  static _trackClock: WebAudioScheduler;
  // static __trackProgress: any;
  // static __trackInstance: any;
  static _activeMPB: number;
  static _activeMeter: number;
  static _activeSampleSet: number;
  static _activeSampleIndex: number;

  static _fadein: number;
  static _preempt: number;

  constructor() {
    console.warn("OsuCommon should not be instantiated!");
  }

  static log(str) {
    if (Settings.DEBUG.enabled === true) {
      console.log(`[OsuCommon] - ${str}`);
    }
  }

  static warn(str) {
    if (Settings.DEBUG.enabled === true) {
      console.warn(`[OsuCommon] - ${str}`);
    }
  }

  static error(str) {
    if (Settings.DEBUG.enabled === true) {
      console.error(`[OsuCommon] - ${str}`);
    }
  }

  /**
   * @param entry
   * @param activeSampleSet
   * @param activeSampleIndex
   * @param requiredAssets
   * @returns {Array}
   * @private
   */
  static getHitSound(
    entry,
    activeSampleSet,
    activeSampleIndex,
    requiredAssets,
  ) {
    let result = [];
    if (!requiredAssets) requiredAssets = {};

    for (let k in entry["hitSound"]) {
      if (entry["hitSound"][k] === true || k === "normal") {
        let sampleSet = activeSampleSet;
        if (
          entry["extras"] &&
          entry["extras"]["sampleSet"] &&
          entry["extras"]["sampleSet"] !== "auto"
        ) {
          sampleSet = entry["extras"]["sampleSet"];
        }
        let file = (
          "snd_" +
          sampleSet +
          "_hit" +
          k +
          (activeSampleIndex <= 1 ? "" : activeSampleIndex.toString())
        ).toLowerCase();

        if (
          entry["extras"] &&
          entry["extras"]["filename"].indexOf(".wav") !== -1 &&
          requiredAssets.hasOwnProperty(entry["extras"]["filename"])
        ) {
          result.push(requiredAssets[entry["extras"]["filename"]].sound);
        } else if (requiredAssets.hasOwnProperty(file)) {
          result.push(requiredAssets[file].sound);
        } else if (global.hasOwnProperty(file)) {
          result.push(global[file]);
        } else {
          file = ("snd_" + activeSampleIndex + "_hit" + k + "").toLowerCase();

          if (global.hasOwnProperty(file)) result.push(global[file]);
          else console.error("Hitsound invalid! " + file);
        }
      }
    }

    return result;
  }

  static initializeAudioCTX(buffer) {
    if (OsuCommon.__AUDIOCTX) return;
    // (function _initializeAudioCTX() {
    OsuCommon.log("initializeAudioCTX");
    OsuCommon.__AUDIOCTX = new AudioContext();
    OsuCommon.__AUDIOGAIN = this.__AUDIOCTX.createGain();
    OsuCommon.__AUDIOSRC = this.__AUDIOCTX.createBufferSource();
    OsuCommon.__AUDIOSRC.buffer = buffer;
    OsuCommon.__AUDIOSRC.connect(this.__AUDIOGAIN);
    OsuCommon.__AUDIOGAIN.connect(this.__AUDIOCTX.destination);
    // }).bind(context)();
  }

  static calculatePreempt(difficulty) {
    let AR = difficulty["ApproachRate"] | Settings.osuDefaults.ApproachRate;

    if (AR < 5) {
      return 1200 + (600 * (5 - AR)) / 5;
    } else if (AR === 5) {
      return 1200;
    } else if (AR > 5) {
      return 1200 - (750 * (AR - 5)) / 5;
    }

    throw new Error("AR not a number!");
  }

  static calculateScoreThreshold(difficulty, timestamp) {
    let OD = difficulty["OverallDifficulty"];
    if (timestamp < 0) timestamp = Math.abs(timestamp);

    if (timestamp < 50 + (30 * (5 - OD)) / 5) {
      return 300;
    } else if (timestamp < 100 + (40 * (5 - OD)) / 5) {
      return 100;
    } else if (timestamp < 50 + (30 * (5 - OD)) / 5) {
      return 50;
    } else {
      return 0;
    }
  }

  static calculateFadein(difficulty) {
    let AR = difficulty["ApproachRate"] | Settings.osuDefaults.ApproachRate;

    if (AR < 5) {
      return 800 + (400 * (5 - AR)) / 5;
    } else if (AR === 5) {
      return 800;
    } else if (AR > 5) {
      return 800 - (500 * (AR - 5)) / 5;
    }

    throw new Error("AR not a number!");
  }

  static createScheduler() {
    // (function _createScheduler() {
    OsuCommon.log("createScheduler");
    if (!this.__AUDIOCTX) {
      throw new Error("Requires audioCTX to be initialized!");
    }
    this._trackClock = new WebAudioScheduler({
      context: this.__AUDIOCTX,
      interval: 0.0125,
      aheadTime: 0.025,
    });
    // }).bind(context)();
  }

  static async playTrack(volume?: number, progress?: number) {
    // (function _playTrack() {
    OsuCommon.log("playTrack");
    // this.__trackProgress = 0;
    // const test = new AudioBufferSourceNode(this.__AUDIOCTX);
    // test.start(progress);
    this._trackClock.start();
    this.__AUDIOSRC.start(0, progress);
    await HelperFunctions.waitForTruth(
      () => this.__AUDIOCTX.state === "running",
      1,
    );
    this.__AUDIOGAIN.gain.setValueAtTime(0.01, this.__AUDIOCTX.currentTime);

    // this._trackClock.currentTime = this.__AUDIOCTX.currentTime = 135000;
    console.log(this._trackClock);
    console.log(this.__AUDIOSRC);
    // console.log(this.__trackInstance);

    // }).bind(context)();
  }

  static setTimingPointData(tpoint) {
    // (function _setTimingPointData() {
    OsuCommon.log("setTimingPointData");
    let tempTpoint = null;
    if (tpoint.args) tempTpoint = tpoint.args;
    else tempTpoint = tpoint;

    this._activeMPB = tempTpoint.mpb;
    this._activeMeter = tempTpoint.meter;
    this._activeSampleSet = tempTpoint.sampleSet;
    this._activeSampleIndex = tempTpoint.sampleIndex;

    // if (PIXI.sound) PIXI.sound.volumeAll = tempTpoint.volume * 0.01 * 1; //this.globalVolume;

    tpoint.done = true;
    // }).bind(context)();
  }
}
