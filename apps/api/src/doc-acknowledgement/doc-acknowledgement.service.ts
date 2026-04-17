import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  InternalDocumentSummary,
  DocAckAssignmentSummary,
  DocAcknowledgementRecord,
  DocumentStatusSummary,
  MyDocumentEntry,
  InternalDocUploadUrlResponse,
  DocAckStatus,
} from '@lumicore/shared-types';
import { EmployeeGroup } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { CreateInternalDocumentDto } from './dto/create-internal-document.dto';
import { UpdateInternalDocumentDto } from './dto/update-internal-document.dto';
import { AssignDocumentDto } from './dto/assign-document.dto';

@Injectable()
export class DocAcknowledgementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Upload URL ───────────────────────────────────────────────────────────

  getUploadUrl(): InternalDocUploadUrlResponse {
    const s3Key = `internal-docs/${randomUUID()}.pdf`;
    return {
      upload_url: `https://placeholder-s3.example.com/${s3Key}`, // TODO(E7): replace with real S3 presigned URL
      s3_key: s3Key,
    };
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateInternalDocumentDto,
    uploadedById: number,
  ): Promise<InternalDocumentSummary> {
    const doc = await this.prisma.internalDocument.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category ?? null,
        s3_key: dto.s3_key,
        version: 1,
        requires_ack: dto.requires_ack ?? true,
        uploaded_by_id: uploadedById,
      },
    });

    return this.toSummary(doc);
  }

  // ─── Find all ─────────────────────────────────────────────────────────────

  async findAll(): Promise<InternalDocumentSummary[]> {
    const docs = await this.prisma.internalDocument.findMany({
      where: { archived_at: null },
      orderBy: { created_at: 'desc' },
    });

    return docs.map((d) => this.toSummary(d));
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(
    id: number,
    dto: UpdateInternalDocumentDto,
  ): Promise<InternalDocumentSummary> {
    const existing = await this.prisma.internalDocument.findUnique({
      where: { id },
    });

    if (!existing || existing.archived_at !== null) {
      throw new NotFoundException(`InternalDocument #${id} not found`);
    }

    // BR-017: new s3_key provided and differs → increment version
    const s3KeyChanged =
      dto.s3_key !== undefined && dto.s3_key !== existing.s3_key;

    const updated = await this.prisma.internalDocument.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.s3_key !== undefined && { s3_key: dto.s3_key }),
        ...(dto.requires_ack !== undefined && {
          requires_ack: dto.requires_ack,
        }),
        ...(s3KeyChanged && { version: { increment: 1 } }),
      },
    });

    return this.toSummary(updated);
  }

  // ─── Archive ──────────────────────────────────────────────────────────────

  async archive(id: number): Promise<void> {
    const existing = await this.prisma.internalDocument.findUnique({
      where: { id },
    });

    if (!existing || existing.archived_at !== null) {
      throw new NotFoundException(`InternalDocument #${id} not found`);
    }

    await this.prisma.internalDocument.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  // ─── Assign ───────────────────────────────────────────────────────────────

  async assign(
    id: number,
    dto: AssignDocumentDto,
    assignedById: number,
  ): Promise<DocAckAssignmentSummary[]> {
    const doc = await this.prisma.internalDocument.findUnique({
      where: { id },
    });

    if (!doc || doc.archived_at !== null) {
      throw new NotFoundException(`InternalDocument #${id} not found`);
    }

    const hasEmployees =
      Array.isArray(dto.employee_ids) && dto.employee_ids.length > 0;
    const hasGroups = Array.isArray(dto.groups) && dto.groups.length > 0;

    if (!hasEmployees && !hasGroups) {
      throw new BadRequestException(
        'At least one employee_id or group must be provided',
      );
    }

    const dueDateValue = dto.due_date ? new Date(dto.due_date) : null;

    // Upsert employee-based assignments
    if (hasEmployees && dto.employee_ids) {
      for (const employeeId of dto.employee_ids) {
        const existing = await this.prisma.docAckAssignment.findFirst({
          where: { document_id: id, employee_id: employeeId },
        });

        if (existing) {
          await this.prisma.docAckAssignment.update({
            where: { id: existing.id },
            data: { due_date: dueDateValue },
          });
        } else {
          await this.prisma.docAckAssignment.create({
            data: {
              document_id: id,
              employee_id: employeeId,
              group: null,
              assigned_by_id: assignedById,
              due_date: dueDateValue,
            },
          });
        }
      }
    }

    // Upsert group-based assignments
    if (hasGroups && dto.groups) {
      for (const group of dto.groups) {
        const existing = await this.prisma.docAckAssignment.findFirst({
          where: { document_id: id, group },
        });

        if (existing) {
          await this.prisma.docAckAssignment.update({
            where: { id: existing.id },
            data: { due_date: dueDateValue },
          });
        } else {
          await this.prisma.docAckAssignment.create({
            data: {
              document_id: id,
              employee_id: null,
              group,
              assigned_by_id: assignedById,
              due_date: dueDateValue,
            },
          });
        }
      }
    }

    // Return all assignments for this document
    const assignments = await this.prisma.docAckAssignment.findMany({
      where: { document_id: id },
      orderBy: { assigned_at: 'asc' },
    });

    return assignments.map((a) => this.toAssignmentSummary(a));
  }

  // ─── Document status (compliance matrix) ─────────────────────────────────

  async getDocumentStatus(id: number): Promise<DocumentStatusSummary> {
    const doc = await this.prisma.internalDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new NotFoundException(`InternalDocument #${id} not found`);
    }

    const assignments = await this.prisma.docAckAssignment.findMany({
      where: { document_id: id },
    });

    // Gather unique employee IDs
    const employeeIdSet = new Set<number>();
    // track per-employee earliest due_date
    const employeeDueDateMap = new Map<number, Date | null>();

    // Direct employee assignments
    for (const a of assignments) {
      if (a.employee_id !== null) {
        employeeIdSet.add(a.employee_id);
        const current = employeeDueDateMap.get(a.employee_id) ?? null;
        const aDate = a.due_date ?? null;
        if (current === null || (aDate !== null && aDate < current)) {
          employeeDueDateMap.set(a.employee_id, aDate);
        }
      }
    }

    // Group-based assignments: expand to employees
    const groupAssignments = assignments.filter((a) => a.group !== null);
    if (groupAssignments.length > 0) {
      const groups = groupAssignments.map((a) => a.group as EmployeeGroup);
      const groupEmployees = await this.prisma.employee.findMany({
        where: {
          group: { in: groups },
          archived_at: null,
        },
        select: { id: true, group: true },
      });

      for (const emp of groupEmployees) {
        // Find the group assignment that covers this employee
        const groupAss = groupAssignments.find((a) => a.group === emp.group);
        if (groupAss) {
          employeeIdSet.add(emp.id);
          const current = employeeDueDateMap.get(emp.id) ?? null;
          const aDate = groupAss.due_date ?? null;
          if (current === null || (aDate !== null && aDate < current)) {
            employeeDueDateMap.set(emp.id, aDate);
          }
        }
      }
    }

    const employeeIds = Array.from(employeeIdSet);

    // Fetch employee names
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, full_name: true },
    });
    const employeeNameMap = new Map(employees.map((e) => [e.id, e.full_name]));

    // Fetch acknowledgements for current version
    const acks = await this.prisma.docAcknowledgement.findMany({
      where: {
        document_id: id,
        document_version: doc.version,
        employee_id: { in: employeeIds },
      },
    });
    const ackMap = new Map(acks.map((a) => [a.employee_id, a]));

    const now = new Date();

    const result = employeeIds.map((empId) => {
      const ack = ackMap.get(empId);
      const dueDate = employeeDueDateMap.get(empId) ?? null;

      let status: DocAckStatus;
      if (ack) {
        status = 'acknowledged';
      } else if (dueDate !== null && dueDate < now) {
        status = 'overdue';
      } else {
        status = 'pending';
      }

      return {
        employee_id: empId,
        employee_name: employeeNameMap.get(empId) ?? 'Unknown',
        status,
        acknowledged_at: ack ? ack.acknowledged_at.toISOString() : null,
        due_date: dueDate ? dueDate.toISOString() : null,
      };
    });

    return {
      document_id: id,
      document_version: doc.version,
      assignments: result,
    };
  }

  // ─── My documents ─────────────────────────────────────────────────────────

  async getMyDocuments(employeeId: number): Promise<MyDocumentEntry[]> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { group: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee #${employeeId} not found`);
    }

    // Find all assignments for this employee (direct or via group)
    const assignments = await this.prisma.docAckAssignment.findMany({
      where: {
        OR: [{ employee_id: employeeId }, { group: employee.group }],
      },
    });

    // Collect unique document IDs
    const documentIdSet = new Set(assignments.map((a) => a.document_id));
    const documentIds = Array.from(documentIdSet);

    if (documentIds.length === 0) {
      return [];
    }

    // Fetch non-archived documents
    const documents = await this.prisma.internalDocument.findMany({
      where: { id: { in: documentIds }, archived_at: null },
    });

    // Fetch current-version acknowledgements for this employee
    const acks = await this.prisma.docAcknowledgement.findMany({
      where: {
        employee_id: employeeId,
        document_id: { in: documentIds },
      },
    });
    const ackMap = new Map(
      acks.map((a) => [`${a.document_id}-${a.document_version}`, a]),
    );

    const now = new Date();

    return documents.map((doc) => {
      // Find earliest due_date from all assignments covering this doc+employee
      const relevantAssignments = assignments.filter(
        (a) => a.document_id === doc.id,
      );
      let earliestDueDate: Date | null = null;
      for (const a of relevantAssignments) {
        if (a.due_date !== null) {
          if (earliestDueDate === null || a.due_date < earliestDueDate) {
            earliestDueDate = a.due_date;
          }
        }
      }

      const ack = ackMap.get(`${doc.id}-${doc.version}`);
      const acknowledged = ack !== undefined;
      const overdue =
        !acknowledged &&
        earliestDueDate !== null &&
        earliestDueDate < now;

      return {
        document_id: doc.id,
        title: doc.title,
        category: doc.category,
        s3_key: doc.s3_key,
        version: doc.version,
        acknowledged,
        acknowledged_at: ack ? ack.acknowledged_at.toISOString() : null,
        due_date: earliestDueDate ? earliestDueDate.toISOString() : null,
        overdue,
      };
    });
  }

  // ─── Acknowledge ──────────────────────────────────────────────────────────

  async acknowledge(
    documentId: number,
    employeeId: number,
  ): Promise<DocAcknowledgementRecord> {
    // Fetch employee to get their group
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { group: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee #${employeeId} not found`);
    }

    // BR-016: verify assignment exists (direct or via group)
    const assignment = await this.prisma.docAckAssignment.findFirst({
      where: {
        document_id: documentId,
        OR: [{ employee_id: employeeId }, { group: employee.group }],
      },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'Document not assigned to this employee',
      );
    }

    // Fetch document
    const doc = await this.prisma.internalDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.archived_at !== null) {
      throw new NotFoundException(`InternalDocument #${documentId} not found`);
    }

    // BR-018: idempotent — return existing acknowledgement if found
    const existing = await this.prisma.docAcknowledgement.findUnique({
      where: {
        document_id_employee_id_document_version: {
          document_id: documentId,
          employee_id: employeeId,
          document_version: doc.version,
        },
      },
    });

    if (existing) {
      return this.toAcknowledgementRecord(existing);
    }

    const ack = await this.prisma.docAcknowledgement.create({
      data: {
        document_id: documentId,
        employee_id: employeeId,
        document_version: doc.version,
      },
    });

    return this.toAcknowledgementRecord(ack);
  }

  // ─── Private mappers ──────────────────────────────────────────────────────

  private toSummary(doc: {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    s3_key: string;
    version: number;
    requires_ack: boolean;
    uploaded_by_id: number;
    created_at: Date;
    updated_at: Date;
    archived_at: Date | null;
  }): InternalDocumentSummary {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      s3_key: doc.s3_key,
      version: doc.version,
      requires_ack: doc.requires_ack,
      uploaded_by_id: doc.uploaded_by_id,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
      archived_at: doc.archived_at ? doc.archived_at.toISOString() : null,
    };
  }

  private toAssignmentSummary(a: {
    id: number;
    document_id: number;
    employee_id: number | null;
    group: string | null;
    assigned_at: Date;
    due_date: Date | null;
  }): DocAckAssignmentSummary {
    return {
      id: a.id,
      document_id: a.document_id,
      employee_id: a.employee_id,
      group: a.group as EmployeeGroup | null,
      assigned_at: a.assigned_at.toISOString(),
      due_date: a.due_date ? a.due_date.toISOString() : null,
    };
  }

  private toAcknowledgementRecord(a: {
    id: number;
    document_id: number;
    employee_id: number;
    document_version: number;
    acknowledged_at: Date;
  }): DocAcknowledgementRecord {
    return {
      id: a.id,
      document_id: a.document_id,
      employee_id: a.employee_id,
      document_version: a.document_version,
      acknowledged_at: a.acknowledged_at.toISOString(),
    };
  }
}
