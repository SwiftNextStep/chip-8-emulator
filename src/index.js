import { Chip8 } from './Chip8';

async function runChip8() {
  const rom = await fetch('./roms/test_opcode');
  const arrayBuffer = await rom.arrayBuffer();
  const romBuffer = new Uint8Array(arrayBuffer);
  const chip8 = new Chip8(romBuffer);
  while (1) {
    await chip8.sleep(200);
    if (chip8.registers.DT > 0) {
      await chip8.sleep();
      chip8.registers.DT--;
    }
    if (chip8.registers.ST > 0) {
      chip8.soundCard.enableSound();
      await chip8.sleep();
      chip8.registers.ST--;
    }
    if (chip8.registers.ST === 0) {
      chip8.soundCard.disableSound();
    }
  }
}

runChip8();
