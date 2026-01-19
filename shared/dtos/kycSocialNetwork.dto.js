class SocialNetworkDTO {
  constructor(socialNetwork) {
    this.person_social_network_id = socialNetwork.person_social_network_id;
    this.person_id = socialNetwork.person_id;
    
    this.provider = {
      id: socialNetwork.provider?.social_network_provider_id || socialNetwork.social_network_provider_id,
      name: socialNetwork.provider?.name || null,
      icon_url: socialNetwork.provider?.icon_url || null,
      base_url: socialNetwork.provider?.base_url || null,
      is_active: socialNetwork.provider?.is_active ?? null
    };

    this.username_handle = socialNetwork.username_handle;
    this.profile_url = socialNetwork.profile_url;
    this.is_verified = socialNetwork.is_verified;
    
    this.created_at = socialNetwork.createdAt;
    this.updated_at = socialNetwork.updatedAt;
  }
}

class SocialNetworkListDTO {
  constructor(socialNetworks) {
    this.total = socialNetworks.length;
    this.social_networks = socialNetworks.map(sn => new SocialNetworkDTO(sn));
  }
}

class AddSocialNetworkResponseDTO extends SocialNetworkDTO {
  constructor(socialNetwork) {
    super(socialNetwork);
  }
}

class UpdateSocialNetworkResponseDTO extends SocialNetworkDTO {
  constructor(socialNetwork) {
    super(socialNetwork);
  }
}

module.exports = {
  SocialNetworkDTO, 
  SocialNetworkListDTO,
  AddSocialNetworkResponseDTO,
  UpdateSocialNetworkResponseDTO
};