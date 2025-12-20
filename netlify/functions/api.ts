import { app } from "../../backend/api";
import serverless from "serverless-http";

export const handler = serverless(app);
