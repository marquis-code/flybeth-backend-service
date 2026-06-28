import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Department, DepartmentDocument } from "./schemas/department.schema";

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  async findAll() {
    return this.departmentModel.find().populate("members", "firstName lastName email avatar").exec();
  }

  async findBySlug(slug: string) {
    return this.departmentModel.findOne({ slug }).populate("members", "firstName lastName email avatar").exec();
  }

  async create(data: Partial<Department>) {
    const existing = await this.departmentModel.findOne({ slug: data.slug });
    if (existing) {
      throw new ConflictException("Department with this slug already exists");
    }
    const created = new this.departmentModel(data);
    return created.save();
  }

  async update(id: string, data: Partial<Department>) {
    const updated = await this.departmentModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate("members", "firstName lastName email avatar");
    if (!updated) throw new NotFoundException("Department not found");
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.departmentModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException("Department not found");
    return { success: true };
  }

  async addMember(id: string, userId: string) {
    const department = await this.departmentModel.findById(id);
    if (!department) throw new NotFoundException("Department not found");

    const objectId = new Types.ObjectId(userId);
    if (!department.members.includes(objectId)) {
      department.members.push(objectId);
      await department.save();
    }
    
    return this.departmentModel.findById(id).populate("members", "firstName lastName email avatar");
  }

  async removeMember(id: string, userId: string) {
    const department = await this.departmentModel.findById(id);
    if (!department) throw new NotFoundException("Department not found");

    const objectId = new Types.ObjectId(userId);
    department.members = department.members.filter(
      (m) => m.toString() !== objectId.toString()
    );
    await department.save();

    return this.departmentModel.findById(id).populate("members", "firstName lastName email avatar");
  }
}
