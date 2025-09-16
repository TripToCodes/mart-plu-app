import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Photo upload utility
export const uploadProducePhoto = async (file, produceId) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${produceId}-${Date.now()}.${fileExt}`;
    const filePath = `produce/${fileName}`;

    const { data, error } = await supabase.storage.from("produce-images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("produce-images").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
};

// Delete photo utility
export const deleteProducePhoto = async (photoUrl) => {
  try {
    if (!photoUrl) return;

    // Extract file path from URL
    const urlParts = photoUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `produce/${fileName}`;

    const { error } = await supabase.storage.from("produce-images").remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
};
