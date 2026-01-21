import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

// Controllers
import { KeyTypeController } from './controllers/key-type.controller';
import { LanguageController } from './controllers/language.controller';
import { MessageCategoryController } from './controllers/message-category.controller';
import { MessageTypeController } from './controllers/message-type.controller';
import { SegmentTypeController } from './controllers/segment-type.controller';
import { VoiceController } from './controllers/voice.controller';

// Services
import { KeyTypeService } from './services/key-type.service';
import { LanguageService } from './services/language.service';
import { MessageCategoryService } from './services/message-category.service';
import { MessageTypeService } from './services/message-type.service';
import { SegmentTypeService } from './services/segment-type.service';
import { VoiceService } from './services/voice.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    KeyTypeController,
    LanguageController,
    MessageCategoryController,
    MessageTypeController,
    SegmentTypeController,
    VoiceController,
  ],
  providers: [
    KeyTypeService,
    LanguageService,
    MessageCategoryService,
    MessageTypeService,
    SegmentTypeService,
    VoiceService,
  ],
  exports: [
    KeyTypeService,
    LanguageService,
    MessageCategoryService,
    MessageTypeService,
    SegmentTypeService,
    VoiceService,
  ],
})
export class DictionariesModule {}
