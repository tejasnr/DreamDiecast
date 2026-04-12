import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Safety net: clean up any expired stock reservations every 10 minutes
crons.interval(
  "cleanup expired stock reservations",
  { minutes: 10 },
  internal.stockReservations.releaseAllExpired
);

export default crons;
