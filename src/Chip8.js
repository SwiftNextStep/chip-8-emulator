import { CHAR_SET } from './constants/charSetContants';
import { SPRITE_HIGHT } from './constants/displayConstants';
import {
  CHAR_SET_ADDRESS,
  LOAD_PROGRAM_ADDRESS,
  MEMORY_SIZE,
} from './constants/memoryConstants';
import { TIMER_60_HZ } from './constants/registersContansts';
import { Disassembler } from './Disassembler';
import { Display } from './Display';
import { Keyboard } from './Keyboard';
import { Memory } from './Memory';
import { Registers } from './Registers';
import { SoundCard } from './SoundCard';
export class Chip8 {
  constructor(romBuffer) {
    console.log('Create a new Chip-8');
    this.memory = new Memory();
    this.registers = new Registers();

    this.loadCharSet();
    this.loadRom(romBuffer);
    this.keyboard = new Keyboard();
    this.soundCard = new SoundCard();
    this.disassember = new Disassembler();
    this.display = new Display(this.memory);
  }
  sleep(ms = TIMER_60_HZ) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  loadCharSet() {
    this.memory.memory.set(CHAR_SET, CHAR_SET_ADDRESS);
  }
  loadRom(romBuffer) {
    console.assert(
      romBuffer.length + LOAD_PROGRAM_ADDRESS <= MEMORY_SIZE,
      'This rom is too large.'
    );
    this.memory.memory.set(romBuffer, LOAD_PROGRAM_ADDRESS);
    this.registers.PC = LOAD_PROGRAM_ADDRESS;
  }

  async execute(opcode) {
    const { instruction, args } = this.disassember.disassemble(opcode);
    const { id } = instruction;
    console.log('i', instruction);
    console.log('a', args);
    console.log('id', id);
    switch (id) {
      case 'CLS':
        this.display.reset();
        break;
      case 'RET':
        this.registers.PC = this.registers.stackPop();
        break;
      case 'JP_ADDR':
        this.registers.PC = args[0];
        break;
      case 'CALL_ADDR':
        this.registers.stackPush(this.registers.PC);
        this.registers.PC = args[0];
        break;
      case 'SE_VX_KK':
        if (this.registers.V[args[0]] === args[1]) {
          this.registers.PC += 2;
        }
        break;
      case 'SNE_VX_KK':
        if (this.registers.V[args[0]] !== args[1]) {
          this.registers.PC += 2;
        }
        break;
      case 'SE_VX_VY':
        if (this.registers.V[args[0]] === this.registers.V[args[1]]) {
          this.registers.PC += 2;
        }
        break;
      case 'LD_VX_KK':
        this.registers.V[args[0]] = args[1];
        break;
      case 'ADD_VX_KK':
        this.registers.V[args[0]] += args[1];
        break;
      case 'LD_VX_VY':
        this.registers.V[args[0]] = this.registers.V[args[1]];
        break;
      case 'OR_VX_VY':
        this.registers.V[args[0]] |= this.registers.V[args[1]];
        break;
      case 'AND_VX_VY':
        this.registers.V[args[0]] &= this.registers.V[args[1]];
        break;
      case 'XOR_VX_VY':
        this.registers.V[args[0]] ^= this.registers.V[args[1]];
        break;
      case 'ADD_VX_VY':
        this.registers.V[0x0f] =
          this.registers.V[args[0]] + this.registers.V[args[1]] > 0xff;
        this.registers.V[args[0]] += this.registers.V[args[1]];
        break;
      case 'SUB_VX_VY':
        this.registers.V[0x0f] =
          this.registers.V[[args[0]]] > this.registers.V[args[1]];
        this.registers.V[args[0]] -= this.registers.V[args[1]];
        break;
      case 'SHR_VX_VY':
        this.registers.V[0x0f] = this.registers.V[args[0]] & 0x01;
        this.registers.V[args[0]] >>= 1;
        break;
      case 'SUBN_VX_VY':
        this.registers.V[0x0f] =
          this.registers.V[args[1]] > this.registers.V[args[0]];
        this.registers.V[args[0]] =
          this.registers.V[args[1]] - this.registers.V[args[0]];
        break;
      case 'SHL_VX_VY':
        this.registers.V[0x0f] = Boolean(this.registers.V[args[0]] & 0x80); //0b10000000
        this.registers.V[args[0]] <<= 1;
        break;
      case 'SNE_VX_VY':
        if (this.registers.V[args[0]] !== this.registers.V[args[1]]) {
          this.registers.PC += 2;
        }
        break;
      case 'LD_I_ADDR':
        this.registers.I = args[0];
        break;
      case 'JP_V0_ADDR':
        this.registers.PC = this.registers.V[0] + args[0];
        break;
      case 'RND_VX_KK':
        const random = Math.floor(Math.random() * 0xff);
        this.registers.V[args[0]] = random & args[1];
        break;
      case 'DRW_VX_VY_N':
        const colision = this.display.drawSprite(
          this.registers.V[args[0]],
          this.registers.V[args[1]],
          this.registers.I,
          args[2]
        );
        this.registers.V[0x0f] = colision;
        break;
      case 'SKP_VX':
        if (this.keyboard.isKeydown(this.registers.V[args[0]])) {
          this.registers.PC += 2;
        }
        break;
      case 'SKNP_VX':
        if (!this.keyboard.isKeydown(this.registers.V[args[0]])) {
          this.registers.PC += 2;
        }
        break;
      case 'LD_VX_DT':
        this.registers.V[args[0]] = this.registers.DT;
        break;
      case 'LD_VX_K':
        let keyPressed = -1;
        while (keyPressed === -1) {
          keyPressed = this.keyboard.hasKeydown();
          await this.sleep();
        }
        this.registers.V[args[0]] = keyPressed;
        console.log('got key', this.registers.V[args[0]]);
        break;
      case 'LD_DT_VX':
        this.registers.DT = this.registers.V[args[0]];
        break;
      case 'LD_ST_VX':
        this.registers.ST = this.registers.V[args[0]];
        break;
      case 'ADD_I_VX':
        this.registers.I += this.registers.V[args[0]];
        break;
      case 'LD_F_VX':
        this.registers.I = this.registers.V[args[0]] * SPRITE_HIGHT;
        break;
      case 'LD_B_VX':
        let x = this.registers.V[args[0]];
        const hundreds = Math.floor(x / 100);
        x = x - hundreds * 100;
        const tens = Math.floor(x / 10);
        const ones = x - tens * 10;
        this.memory.memory[this.registers.I] = hundreds;
        this.memory.memory[this.registers.I + 1] = tens;
        this.memory.memory[this.registers.I + 2] = ones;
        break;
      case 'LD_I_VX':
        for (let i = 0; i <= args[0]; i++) {
          this.memory.memory[this.registers.I + i] = this.registers.V[i];
        }
        break;
      case 'LD_VX_I':
        for (let i = 0; i <= args[0]; i++) {
          this.registers.V[i] = this.memory.memory[this.registers.I + i];
        }
        break;
      default:
        console.error(`Instruction with id ${id} not found`, instruction, args);
    }
  }
}
