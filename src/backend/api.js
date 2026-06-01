// api.js
export const reviewService = {
  // Fonction pour ajouter un avis
  addReview: async (carId, userId, rating, comment) => {
    return await supabase
      .from('reviews')
      .insert([{
        car_id: carId,
        user_id: userId,
        rating: rating,
        comment: comment
      }]);
  },

  // Fonction pour récupérer les avis d'une voiture
  getReviewsByCar: async (carId) => {
    return await supabase
      .from('reviews')
      .select('*, users_table(full_name)') // Suppose que tu as un lien vers users_table
      .eq('car_id', carId)
      .order('created_at', { ascending: false });
  }
};
