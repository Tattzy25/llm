export type RobotItem = {
  id: string;
  title: string;
  imageUrl: string;
  provider?: "openai" | "anthropic" | "google" | "meta" | "mistral" | "other";
  description?: string;
};

export const ROBOT_ITEMS: RobotItem[] = [
  { id: "r1", title: "Robot #1", imageUrl: "https://i.imgur.com/knWGczP.png" },
  { id: "r2", title: "Robot #2", imageUrl: "https://i.imgur.com/LctgqQi.png" },
  { id: "r3", title: "Robot #3", imageUrl: "https://i.imgur.com/tJ8gK9v.png" },
  { id: "r4", title: "Robot #4", imageUrl: "https://i.imgur.com/wbcNaeE.png" },
  { id: "r5", title: "Robot #5", imageUrl: "https://i.imgur.com/ZDr6TZH.png" },
  { id: "r6", title: "Robot #6", imageUrl: "https://i.imgur.com/iRNiUox.png" },
  { id: "r7", title: "Robot #7", imageUrl: "https://i.imgur.com/00kctzS.png" },
  { id: "r8", title: "Robot #8", imageUrl: "https://i.imgur.com/X0WePT9.png" },
  { id: "r9", title: "Robot #9", imageUrl: "https://i.imgur.com/B7MJV87.png" },
  { id: "r10", title: "Robot #10", imageUrl: "https://i.imgur.com/d1afv4l.png" },
  { id: "r11", title: "Robot #11", imageUrl: "https://i.imgur.com/Pe9b3DU.png" },
  { id: "r12", title: "Robot #12", imageUrl: "https://i.imgur.com/rH4H6Jq.png" },
  { id: "r13", title: "Robot #13", imageUrl: "https://i.imgur.com/jAm06jg.png" },
  { id: "r14", title: "Robot #14", imageUrl: "https://i.imgur.com/lRNiWWN.png" },
  { id: "r15", title: "Robot #15", imageUrl: "https://i.imgur.com/Fnx7nzb.png" },
  { id: "r16", title: "Robot #16", imageUrl: "https://i.imgur.com/GDAt5af.png" },
  { id: "r17", title: "Robot #17", imageUrl: "https://i.imgur.com/0oeewhf.png" },
  { id: "r18", title: "Robot #18", imageUrl: "https://i.imgur.com/WD9qthT.png" },
  { id: "r19", title: "Robot #19", imageUrl: "https://i.imgur.com/ekREzpT.png" },
  { id: "r20", title: "Robot #20", imageUrl: "https://i.imgur.com/3n4jAFI.png" },
  { id: "r21", title: "Robot #21", imageUrl: "https://i.imgur.com/1uGT36l.png" },
  { id: "r22", title: "Robot #22", imageUrl: "https://i.imgur.com/7RxZ6BL.png" },
  { id: "r23", title: "Robot #23", imageUrl: "https://i.imgur.com/4XPRgs5.png" },
  { id: "r24", title: "Robot #24", imageUrl: "https://i.imgur.com/9Bio7FC.png" },
  { id: "r25", title: "Robot #25", imageUrl: "https://i.imgur.com/d9F52s9.png" },
];
