// Every external link in one place. Empty strings are hidden in the UI.
export const GITHUB = 'https://github.com/Duckafaligy/evohacks-2-medlens';
export const DOCS = 'https://docs.google.com/document/d/1FEckOsG79ySgyq6m0kZAeObE2CAdkorkzS5N2vTJ4zY/edit?usp=sharing';
export const YOUTUBE = ''; // demo video URL goes here
export const DEVPOST = '';
export const OPENFDA = 'https://open.fda.gov/apis/drug/label/';

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&fm=jpg`;
export const PHOTOS = {
  seniors: unsplash('1666887360752-ad592183fea1'), // Nappy
  caregivers: unsplash('1563213126-a4273aed2016'), // Laurynas Me
  parents: unsplash('1729949131717-a29b5dccb1e3'), // Shutter Speed
};
export const PHOTO_CREDIT = 'Photos: Nappy, Laurynas Me and Shutter Speed on Unsplash';
