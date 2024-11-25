import cors from "cors";

export const corsSetup = (app: any) => {
  app.use(cors());
};
