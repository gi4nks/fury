import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Reset the database to clean state
    const { stdout, stderr } = await execAsync("npx prisma migrate reset --force", {
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
      output: stdout,
      error: stderr,
    });
  } catch (error) {
    console.error("Database reset failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset database",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}