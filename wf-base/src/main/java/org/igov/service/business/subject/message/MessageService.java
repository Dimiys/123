package org.igov.service.business.subject.message;

import org.igov.io.GeneralConfig;
import org.igov.io.web.HttpRequester;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * @author Oleksii Khalikov
 */
@Service
public class MessageService {
    private static final Logger LOG = LoggerFactory.getLogger(MessageService.class);

    @Autowired
    private GeneralConfig oGeneralConfig;

    @Autowired
    private HttpRequester oHttpRequester;
    
    
    /**
     * Получение сообщений по заявке
     * @param nID_Process - номер-ИД процесса
     * @return массив сообщений (строка JSON)
     */
    public String gerOrderMessagesByProcessInstanceID(Long nID_Process) throws Exception {
        String sID_Order = oGeneralConfig.getOrderId_ByProcess(nID_Process);
        Map<String, String> params = new HashMap<>();
        int nID_Server_current = oGeneralConfig.getSelfServerId();
        
        params.put("sID_Order", sID_Order);
        
        LOG.info("SelfHost in gerOrderMessagesByProcessInstanceID: {}", oGeneralConfig.getSelfHost());
        
        /*if(oGeneralConfig.getSelfHost().contains("region")){
            params.put("isRegion", "true");
            
        }*/
        
        if(nID_Server_current == Integer.parseInt(sID_Order.split("-")[0])){
            LOG.info("we get messages from region server");
            params.put("isRegion", "true");
        }
        
        String soResponse = "";
        String sURL = oGeneralConfig.getSelfHostCentral() + "/wf/service/subject/message/getServiceMessages";
        soResponse = oHttpRequester.getInside(sURL, params);
        LOG.info("(soResponse={})", soResponse);
        return soResponse;
    }

}
