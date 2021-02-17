import { INSTRUCTION_SET } from './constants/instructionSet';

export class Disassembler {
  disassemble(opcode) {
    const instruction = INSTRUCTION_SET.find(
      (instruction) => (opcode & instruction.mask) === instruction.pattern
    );
    const args = instruction.arguments.map(
      (arg) => (opcode & arg.mask) >> arg.shift
    );
    return { instruction, args };
  }
}
