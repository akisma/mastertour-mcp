import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompanyContacts } from '../../src/tools/getCompanyContacts.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getCompanyContacts', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getCompanyContacts: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted contacts for a company', async () => {
    const mockData = {
      companyId: 'company-123',
      companyName: 'Live Nation',
      contacts: [
        {
          name: 'Bob Promoter',
          title: 'Senior Promoter',
          email: 'bob@livenation.com',
          phone: '555-1234',
          department: 'Promotions',
        },
        {
          name: 'Alice Booking',
          title: 'Booking Agent',
          phone: '555-5678',
        },
      ],
    };

    (mockClient.getCompanyContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getCompanyContacts(mockClient, { companyId: 'company-123' });

    expect(mockClient.getCompanyContacts).toHaveBeenCalledWith('company-123');
    expect(result.data.totalContacts).toBe(2);
    expect(result.text).toContain('Live Nation');
    expect(result.text).toContain('Bob Promoter');
    expect(result.text).toContain('bob@livenation.com');
    expect(result.text).toContain('Alice Booking');
  });

  it('handles empty contacts list', async () => {
    const mockData = {
      companyId: 'company-123',
      companyName: 'Empty Company',
      contacts: [],
    };

    (mockClient.getCompanyContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getCompanyContacts(mockClient, { companyId: 'company-123' });

    expect(result.data.totalContacts).toBe(0);
    expect(result.text).toContain('No contacts on file');
  });

  it('throws error when no company ID provided', async () => {
    await expect(getCompanyContacts(mockClient, { companyId: '' })).rejects.toThrow(
      'Company ID is required'
    );
  });

  it('groups contacts by department', async () => {
    const mockData = {
      companyId: 'company-123',
      contacts: [
        { name: 'Sales Rep A', department: 'Sales', phone: '111' },
        { name: 'Sales Rep B', department: 'Sales', phone: '222' },
        { name: 'Marketing Lead', department: 'Marketing', phone: '333' },
      ],
    };

    (mockClient.getCompanyContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getCompanyContacts(mockClient, { companyId: 'company-123' });

    expect(result.text).toContain('Sales');
    expect(result.text).toContain('Marketing');
    expect(result.data.totalContacts).toBe(3);
  });

  it('uses title as fallback when no department', async () => {
    const mockData = {
      companyId: 'company-123',
      contacts: [
        { name: 'Tour Manager', title: 'Tour Manager' },
      ],
    };

    (mockClient.getCompanyContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getCompanyContacts(mockClient, { companyId: 'company-123' });

    expect(result.text).toContain('Tour Manager');
  });
});
