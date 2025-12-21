import { Injectable } from '@nestjs/common';

const waitUntilNextTimestamp = (currentTimestamp: number) => {
  let nextTimestamp = Date.now();
  while (nextTimestamp <= currentTimestamp) {
    nextTimestamp = Date.now();
  }
  return nextTimestamp;
};

const DEFAULTS = {
  WORKER_ID: 0,
  EPOCH: 1597017600000,
};

const CONFIG = {
  TIMESTAMP_BITS: 42,
  WORKER_ID_BITS: 10,
  SEQUENCE_BITS: 12,
};

@Injectable()
export class Snowflake {
  private workerId: number;
  private epoch: number;
  private lastTimestamp: number;
  private sequence: number;
  private maxSequence: number;

  constructor(workerId = DEFAULTS.WORKER_ID, epoch = DEFAULTS.EPOCH) {
    this.workerId = workerId;
    this.epoch = epoch;
    this.lastTimestamp = -1;
    this.sequence = 0;
    this.maxSequence = (1 << CONFIG.SEQUENCE_BITS) - 1;
  }

  generate() {
    let timestamp = Date.now();

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock is moving backwards!');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & this.maxSequence;
      if (this.sequence === 0) {
        timestamp = waitUntilNextTimestamp(timestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    const timestampOffset = timestamp - this.epoch;

    const timestampBits = timestampOffset
      .toString(2)
      .padStart(CONFIG.TIMESTAMP_BITS, '0');
    const workerIdBits = this.workerId
      .toString(2)
      .padStart(CONFIG.WORKER_ID_BITS, '0');
    const sequenceBits = this.sequence
      .toString(2)
      .padStart(CONFIG.SEQUENCE_BITS, '0');

    const idBinary = `${timestampBits}${workerIdBits}${sequenceBits}`;
    return BigInt('0b' + idBinary).toString();
  }
}
