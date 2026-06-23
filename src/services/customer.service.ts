import {
  customerRepository,
  type CustomerListParams,
} from "@/repositories/customer.repository";
import type { Paginated } from "@/repositories/user.repository";
import type {
  Customer,
  CustomerInput,
  CustomerPatchInput,
} from "@/models/customers/customer.model";

export const customerService = {
  list(params: CustomerListParams): Promise<Paginated<Customer>> {
    return customerRepository.list(params);
  },

  getById(id: string): Promise<Customer> {
    return customerRepository.getById(id);
  },

  create(input: CustomerInput): Promise<Customer | null> {
    return customerRepository.create(input);
  },

  update(id: string, input: CustomerPatchInput): Promise<Customer | null> {
    return customerRepository.update(id, input);
  },

  delete(id: string): Promise<void> {
    return customerRepository.delete(id);
  },
};
