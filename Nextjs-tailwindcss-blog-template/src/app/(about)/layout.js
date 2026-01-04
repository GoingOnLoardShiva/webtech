import InsightRoll from "@/src/components/About/InsightRoll";


const insights = [
    "2+ Projects Completed",
    "0+ Years of Freelancing",
    "99% Client Satisfaction",
    "Student at Ucodemy",
    "Learning Frontend & Backend Development",
    "Open to Collaboration",

  ];

export default function AboutLayout({ children }) {
  return (
    <main className="w-full flex flex-col items-center justify-between">
      <InsightRoll insights={insights} />
      {children}
    </main>
  );
}
