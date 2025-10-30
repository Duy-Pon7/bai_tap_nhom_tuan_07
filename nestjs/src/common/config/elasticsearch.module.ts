import { Global, Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.config';

/**
 * Global module để inject client Elasticsearch ở bất kỳ đâu
 */
@Global()
@Module({
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
