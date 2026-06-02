export interface Address {
  id: string;
  street: string;
  number?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressFormData {
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}
