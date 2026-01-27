// Additional winner details (level, mentors) from the awards CSV
// Keyed by "LastName,FirstName" for lookup

export interface WinnerDetail {
  level: string;
  mentor1: string;
  mentor2: string;
}

export const WINNER_DETAILS: Record<string, WinnerDetail> = {
  "Bevis,Owen": { level: "PhD Student", mentor1: "Susan Bailey", mentor2: "Tom LaRocca" },
  "Castro Romerao,Ana Valeria": { level: "PhD Student", mentor1: "Christopher Vaaga", mentor2: "" },
  "Correa,Vanessa": { level: "PhD Student", mentor1: "Seonil Kim", mentor2: "" },
  "Crisologo,Taylor": { level: "DVM Student", mentor1: "Sue VandeWoude", mentor2: "" },
  "Cuzmar,Naija": { level: "DVM Student", mentor1: "Russell Moore", mentor2: "Tracy Webb" },
  "Denison,Genevieve": { level: "Undergraduate", mentor1: "Carleigh Fedorka", mentor2: "" },
  "Downing,Sophie": { level: "Undergraduate", mentor1: "Jenny Sones", mentor2: "Ryan Eastman" },
  "Dunn,Brandi": { level: "Resident/ PhD Student", mentor1: "Fiona Hollinshead", mentor2: "" },
  "Faulkner,Isabella": { level: "Post-Baccalaureate", mentor1: "Jenny Sones", mentor2: "" },
  "Gad,Ahmed": { level: "Postdoc", mentor1: "Fiona Hollinshead", mentor2: "" },
  "Gamble,Jessica": { level: "Undergraduate", mentor1: "Candace Mathiason", mentor2: "Erin McNulty" },
  "Girish,Gehena": { level: "PhD Student", mentor1: "Grace Borlee", mentor2: "Caroline Mehaffy" },
  "Goldblatt,Benjamin": { level: "DVM Student", mentor1: "Kristin Zersen", mentor2: "" },
  "Gonzalez-Castro,Raul": { level: "Postdoc", mentor1: "Elaine Carnevale", mentor2: "" },
  "Greenhut,Kelly": { level: "DVM Student", mentor1: "Colleen Duncan", mentor2: "Caroline Kern-Allely" },
  "Hamner,Isabella": { level: "Undergraduate", mentor1: "Carleigh Fedorka", mentor2: "" },
  "Hilliard,Julia": { level: "PhD Student", mentor1: "Casey Gries", mentor2: "" },
  "Howard,Jocelyn": { level: "Undergraduate", mentor1: "Carleigh Fedorka", mentor2: "" },
  "Jakes,Grace": { level: "DVM-PhD Student", mentor1: "Sarah Raabis", mentor2: "Steve Dow" },
  "Jones,Socks": { level: "Undergraduate", mentor1: "Raymond Goodrich", mentor2: "Noelia Altina" },
  "Klosowski,Marika": { level: "Resident/ PhD Student", mentor1: "Dan Regan", mentor2: "Michael Leibowitz" },
  "LoCascio,Tiarnan": { level: "Undergraduate", mentor1: "Casey Gries", mentor2: "" },
  "Lovell,Tiffini": { level: "PhD Student", mentor1: "Ana Clara Bobadilla", mentor2: "" },
  "Malmstrom,Kendall": { level: "PhD Student", mentor1: "Dan Regan", mentor2: "" },
  "Mangold,Emma": { level: "Research Coordinator", mentor1: "Steve Dow", mentor2: "" },
  "Masca,Samantha": { level: "DVM Student", mentor1: "Catriona MacPhail", mentor2: "Sarah Marvel" },
  "McClellan,Katelyn": { level: "DVM Student", mentor1: "Matthew Jorgensen", mentor2: "Gayathriy Balamayooran" },
  "Morris,Ashley": { level: "Undergraduate", mentor1: "Thomas Johnson", mentor2: "" },
  "Moseley,Madeleine": { level: "PhD Student", mentor1: "Bret Smith", mentor2: "" },
  "Olszewski,Charlotte": { level: "Undergraduate", mentor1: "Caroline Mehaffy", mentor2: "" },
  "Perkins,Em": { level: "Post-Baccalaureate", mentor1: "Katriana Popichak", mentor2: "" },
  "Pogge,Quinn": { level: "Undergraduate", mentor1: "Katriana Popichak", mentor2: "" },
  "Ramirez,Ghyslaine": { level: "PhD Student", mentor1: "Dawit Tesfaye", mentor2: "" },
  "Razquin,Patricio": { level: "Resident/ MS Student", mentor1: "Jenny Sones", mentor2: "Jenn Hatzel" },
  "Roh,Scott": { level: "PhD Student", mentor1: "Seonil Kim", mentor2: "" },
  "Schuller,Adam": { level: "Postdoc", mentor1: "Ron Tjalkens", mentor2: "" },
  "Shang,Rui": { level: "DVM Student", mentor1: "Keara Boss", mentor2: "" },
  "Shiraishi,Hikaru": { level: "DVM Student", mentor1: "Miranda Sadar", mentor2: "" },
  "Singer,Jacob": { level: "PhD Student", mentor1: "Lynn Pezzanite", mentor2: "Steve Dow" },
  "Slinkard,Powell": { level: "Resident", mentor1: "Linda Dillenbeck", mentor2: "" },
  "Stigall,Alex": { level: "DVM-PhD Student", mentor1: "Katie Sikes", mentor2: "" },
  "Talbot,Charles": { level: "PhD Student", mentor1: "Steve Dow", mentor2: "Kristin Zersen" },
  "Travieso,Tatianna": { level: "DVM-PhD Student", mentor1: "Anne Avery", mentor2: "Emily Rout" },
  "Tyer,Leo": { level: "PhD Student", mentor1: "Mark Zabel", mentor2: "Claire de la Serre" },
  "Uhrig,Mollie": { level: "PhD Student", mentor1: "Claudia Wiese", mentor2: "" },
  "Walz,Kianna": { level: "Undergraduate", mentor1: "Carleigh Fedorka", mentor2: "" },
  "Worthington,Delaney": { level: "PhD Student", mentor1: "Nicole Kelp", mentor2: "Caroline Mehaffy" },
  "Young,Lauren": { level: "MS Student", mentor1: "Rick McCosh", mentor2: "" },
};

/** Look up winner details by presenter name */
export function getWinnerDetail(lastName: string, firstName: string): WinnerDetail | undefined {
  return WINNER_DETAILS[`${lastName},${firstName}`];
}
