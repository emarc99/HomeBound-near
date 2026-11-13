export const SAMPLE_PHOTOS = {
  "lintel-pass": {
    file: "lintel-pass.jpg",
    label: "Cast Lintel Beam",
    tag: "Passes all 5 checks",
    hint: "Ibadan GPS · Nov 4 · Cast lintel visible",
  },
  "lintel-incomplete": {
    file: "lintel-incomplete.jpg",
    label: "Unpoured Lintel",
    tag: "AI Vision fails",
    hint: "Ibadan GPS · Blockwork without lintel beam",
  },
  "off-site-lagos": {
    file: "off-site-lagos.jpg",
    label: "Lagos Site Photo",
    tag: "GPS check fails",
    hint: "121.6 km away from Ibadan site pin",
  },
  "abandoned-ruin": {
    file: "abandoned-ruin.jpg",
    label: "Overgrown Structure",
    tag: "AI Vision fails",
    hint: "Abandoned shell · Fails stage criteria",
  },
} as const;

export type SamplePhotoKey = keyof typeof SAMPLE_PHOTOS;
