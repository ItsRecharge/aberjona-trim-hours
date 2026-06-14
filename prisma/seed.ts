import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function utcMidnight(daysFromToday: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday),
  );
}

async function main() {
  const email = process.env.BOOTSTRAP_OFFICER_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_OFFICER_PASSWORD;
  const name = process.env.BOOTSTRAP_OFFICER_NAME?.trim() || "Chapter Officer";

  if (!email || !password) {
    console.log(
      "Skipping bootstrap officer: set BOOTSTRAP_OFFICER_EMAIL and BOOTSTRAP_OFFICER_PASSWORD in .env",
    );
  } else {
    const [firstName, ...rest] = name.split(/\s+/);
    const officer = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        firstName,
        lastName: rest.join(" "),
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "officer",
        emailVerifiedAt: new Date(), // bootstrap account skips verification
      },
    });
    console.log(`Bootstrap officer ready: ${officer.email} (id=${officer.id})`);

    if (process.env.SEED_DEMO === "true") {
      await seedDemo(officer.id);
    }
  }
}

/** Demo data mirroring the original Flask seed (local dev only). */
async function seedDemo(officerId: number) {
  const existing = await db.user.findUnique({ where: { email: "member1@demo.local" } });
  if (existing) {
    console.log("Demo data already seeded, skipping.");
    return;
  }

  const member = await db.user.create({
    data: {
      firstName: "Member",
      lastName: "1",
      email: "member1@demo.local",
      passwordHash: await bcrypt.hash("MemberDemo1!", 12),
      role: "member",
      emailVerifiedAt: new Date(),
    },
  });

  const foodDrive = await db.event.create({
    data: {
      title: "Winter Food Drive",
      description: "Sorting and packing donations at the community food pantry.",
      date: utcMidnight(-60),
      location: "Community Center",
      hoursValue: 3.0,
      status: "completed",
      createdById: officerId,
      approvedById: officerId,
    },
  });
  await db.eventSignup.create({
    data: {
      eventId: foodDrive.id,
      userId: member.id,
      attended: true,
      markedById: officerId,
    },
  });

  const concert = await db.event.create({
    data: {
      title: "Spring Concert Volunteering",
      description: "Ushering, setup, and teardown for the spring concert.",
      date: utcMidnight(21),
      location: "School Auditorium",
      hoursValue: 2.0,
      status: "active",
      createdById: officerId,
      approvedById: officerId,
    },
  });
  await db.eventSignup.create({
    data: { eventId: concert.id, userId: member.id },
  });

  await db.event.create({
    data: {
      title: "Library Reading Program",
      description: "Reading with elementary school students at the town library.",
      date: utcMidnight(30),
      location: "Town Library",
      hoursValue: 1.5,
      status: "pending_approval",
      createdById: member.id,
    },
  });

  console.log(`Demo data seeded: member1@demo.local / MemberDemo1! + 3 events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
