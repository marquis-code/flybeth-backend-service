import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { DepartmentService } from "./department.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

@Controller("departments")
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  async findAll() {
    const data = await this.departmentService.findAll();
    return { success: true, data, message: "Departments fetched successfully" };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any) {
    const data = await this.departmentService.create(body);
    return { success: true, data, message: "Department created successfully" };
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async update(@Param("id") id: string, @Body() body: any) {
    const data = await this.departmentService.update(id, body);
    return { success: true, data, message: "Department updated successfully" };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: string) {
    await this.departmentService.delete(id);
    return { success: true, message: "Department deleted successfully" };
  }

  @Post(":id/members")
  @UseGuards(JwtAuthGuard)
  async addMember(@Param("id") id: string, @Body("userId") userId: string) {
    const data = await this.departmentService.addMember(id, userId);
    return { success: true, data, message: "Member added successfully" };
  }

  @Delete(":id/members/:userId")
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param("id") id: string,
    @Param("userId") userId: string
  ) {
    const data = await this.departmentService.removeMember(id, userId);
    return { success: true, data, message: "Member removed successfully" };
  }
}
