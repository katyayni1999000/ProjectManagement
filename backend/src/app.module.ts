import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { JournalsModule } from './journals/journals.module';

@Module({
  imports: [TasksModule, ProjectsModule, AuthModule, JournalsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
