import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';

async function checkAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  
  const email = "abahmarquis@gmail.com";
  const user = await usersService.findByEmail(email, true);
  
  if (user) {
    console.log("User found:");
    console.log("- Email:", user.email);
    console.log("- Active:", user.isActive);
    console.log("- Locked until:", user.lockUntil);
    console.log("- Role:", (user.role as any)?.name || user.role);
    console.log("- Role Object:", user.role);
  } else {
    console.log("User NOT found");
  }
  
  await app.close();
}

checkAdmin();
