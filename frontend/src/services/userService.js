import api from "./api";

const userService = {
  getProfile: async () => {
    const response = await api.get("/user/me/");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch("/user/update_me/", data);
    return response.data;
  },
};

export default userService;
