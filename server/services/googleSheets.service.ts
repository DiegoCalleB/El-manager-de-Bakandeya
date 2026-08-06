/**
 * Google Sheets Service Layer
 * Encapsulates direct API interaction, caching, and fallback persistence for Google Sheets.
 */
import * as sheetsRaw from "../sheets.js";

export const googleSheetsService = {
  // Config & Verification
  getSpreadsheetId: sheetsRaw.getSpreadsheetId,
  getSheetsClient: sheetsRaw.getSheetsClient,
  invalidateValuesCache: sheetsRaw.invalidateValuesCache,

  // Leads
  fetchLeads: sheetsRaw.fetchLeadsFromSheet,
  updateLead: sheetsRaw.updateLeadInSheet,
  appendLead: sheetsRaw.appendLeadToSheet,
  verifyLeadStatusAndWrite: sheetsRaw.verifyLeadStatusAndWrite,

  // Tours
  fetchTours: sheetsRaw.fetchToursFromSheet,
  appendTour: sheetsRaw.appendTourToSheet,
  updateTour: sheetsRaw.updateTourInSheet,
  deleteTour: sheetsRaw.deleteTourInSheet,

  // Concerts
  fetchConcerts: sheetsRaw.fetchConcertsFromSheet,
  appendConcert: sheetsRaw.appendConcertToSheet,
  updateConcert: sheetsRaw.updateConcertInSheet,

  // Rehearsals
  fetchRehearsals: sheetsRaw.fetchRehearsalsFromSheet,
  appendRehearsal: sheetsRaw.appendRehearsalToSheet,
  updateRehearsal: sheetsRaw.updateRehearsalInSheet,

  // Posts & Metrics
  fetchPosts: sheetsRaw.fetchPostsFromSheet,
  appendPost: sheetsRaw.appendPostToSheet,
  updatePost: sheetsRaw.updatePostInSheet,
  fetchMetrics: sheetsRaw.fetchMetricsFromSheet,
  appendMetric: sheetsRaw.appendMetricToSheet,
  updateMetric: sheetsRaw.updateMetricInSheet,

  // Payments
  fetchPayments: sheetsRaw.fetchPaymentsFromSheet,
  appendPayment: sheetsRaw.appendPaymentToSheet,
  updatePayment: sheetsRaw.updatePaymentInSheet,

  // Songs & Setlists
  fetchSongs: sheetsRaw.fetchSongsFromSheet,
  appendSong: sheetsRaw.appendSongToSheet,
  updateSong: sheetsRaw.updateSongInSheet,
  deleteSong: sheetsRaw.deleteSongInSheet,
  fetchSetlists: sheetsRaw.fetchSetlistsFromSheet,
  appendSetlist: sheetsRaw.appendSetlistToSheet,
  updateSetlist: sheetsRaw.updateSetlistInSheet,
  deleteSetlist: sheetsRaw.deleteSetlistInSheet,

  // Bands
  fetchBands: sheetsRaw.fetchBandsFromSheet,
  appendBand: sheetsRaw.appendBandToSheet,
  updateBand: sheetsRaw.updateBandInSheet,
  deleteBand: sheetsRaw.deleteBandInSheet,

  // Fans
  fetchFans: sheetsRaw.fetchFansFromSheet,
  appendFan: sheetsRaw.appendFanToSheet,
  deleteFan: sheetsRaw.deleteFanInSheet
};
