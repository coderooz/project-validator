import { runDoctor } from '@project-validator/core';

export async function doctorCommand(cwd: string) {
  const diagnosis = await runDoctor(cwd);
  console.log(diagnosis);
}
